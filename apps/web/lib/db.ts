// Sunucu tarafı veri erişimi — quran.db salt-okunur açılır (Kur'an verisi değişmezdir).
// Yalnızca server component / route handler içinden import edilir.
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Ayah, AyahTiming, ReaderGroup, Reciter, Surah, Word } from './types';

export function repoRoot(): string {
  if (process.env.QURAN_DATA_ROOT) return process.env.QURAN_DATA_ROOT;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, 'data/processed/quran.db'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('quran.db bulunamadı — önce çalıştırın: npm run -w packages/quran-data build-db');
}

// HMR'de bağlantıyı koru
const g = globalThis as unknown as { __quranDb?: DatabaseSync };
const db = (g.__quranDb ??= new DatabaseSync(path.join(repoRoot(), 'data/processed/quran.db'), { readOnly: true }));

const stripNotes = (t: string) => t.replace(/<sup[^>]*>.*?<\/sup>/g, '');

// node:sqlite satırları null-prototype döner; RSC serileştirmesi düz nesne ister.
const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;

export function getSurahs(): Surah[] {
  return db.prepare('SELECT * FROM surahs ORDER BY id').all().map((r) => plain<Surah>(r));
}

export function getSurah(id: number): Surah | null {
  const row = db.prepare('SELECT * FROM surahs WHERE id = ?').get(id);
  return row ? plain<Surah>(row) : null;
}

export function getReciters(): Reciter[] {
  return db.prepare('SELECT slug, name FROM reciters ORDER BY name').all().map((r) => plain<Reciter>(r));
}

type WordRow = { ayah: number; position: number; text_uthmani: string; tr: string | null; en: string | null; transliteration: string | null; page: number };
type TransRow = { verse_key: string; lang: string; text: string };
type AyahRow = { ayah: number; verse_key: string; page: number; juz: number };

function buildAyahs(surahId: number, ayahFilter?: Set<number>): Ayah[] {
  const ayahRows = (db.prepare('SELECT ayah, verse_key, page, juz FROM ayahs WHERE surah = ? ORDER BY ayah')
    .all(surahId) as unknown as AyahRow[]).filter((a) => !ayahFilter || ayahFilter.has(a.ayah));
  const words = db.prepare('SELECT ayah, position, text_uthmani, tr, en, transliteration, page FROM words WHERE surah = ? ORDER BY ayah, position')
    .all(surahId) as unknown as WordRow[];
  const meals = new Map<string, { tr: string; en: string }>();
  for (const t of db.prepare("SELECT verse_key, lang, text FROM translations WHERE verse_key LIKE ?")
    .all(`${surahId}:%`) as unknown as TransRow[]) {
    const m = meals.get(t.verse_key) ?? { tr: '', en: '' };
    m[t.lang as 'tr' | 'en'] = stripNotes(t.text);
    meals.set(t.verse_key, m);
  }
  const wordsByAyah = new Map<number, Word[]>();
  for (const w of words) {
    if (!wordsByAyah.has(w.ayah)) wordsByAyah.set(w.ayah, []);
    wordsByAyah.get(w.ayah)!.push({ p: w.position, ar: w.text_uthmani, tr: w.tr, en: w.en, tl: w.transliteration });
  }
  return ayahRows.map((a) => ({
    ayah: a.ayah,
    key: a.verse_key,
    page: a.page,
    juz: a.juz,
    words: wordsByAyah.get(a.ayah) ?? [],
    meal: meals.get(a.verse_key) ?? { tr: '', en: '' },
  }));
}

export function getSurahContent(id: number): ReaderGroup | null {
  const surah = getSurah(id);
  if (!surah) return null;
  return { surah, ayahs: buildAyahs(id) };
}

// Sayfadaki (KFGQPC V2, 1–604) tüm ayetler; sayfa sınırı ayet ortasından geçebilir,
// ayet en az bir kelimesi bu sayfadaysa bütün olarak dahil edilir.
export function getPageContent(page: number): ReaderGroup[] {
  const rows = db.prepare('SELECT DISTINCT surah, ayah FROM words WHERE page = ? ORDER BY surah, ayah')
    .all(page) as unknown as { surah: number; ayah: number }[];
  const bySurah = new Map<number, Set<number>>();
  for (const r of rows) {
    if (!bySurah.has(r.surah)) bySurah.set(r.surah, new Set());
    bySurah.get(r.surah)!.add(r.ayah);
  }
  return [...bySurah.entries()].map(([surahId, ayahSet]) => ({
    surah: getSurah(surahId)!,
    ayahs: buildAyahs(surahId, ayahSet),
  }));
}

// Tembel yüklenen ek meal dilleri — verse_key → metin
export function getMealMap(lang: string, surah: number): Record<string, string> {
  const rows = db.prepare('SELECT verse_key, text FROM translations WHERE lang = ? AND verse_key LIKE ?')
    .all(lang, `${surah}:%`) as unknown as { verse_key: string; text: string }[];
  return Object.fromEntries(rows.map((r) => [r.verse_key, stripNotes(r.text)]));
}

// Tembel yüklenen ek kelime-kelime diller (ur/hi) — location → metin
export function getWordLangMap(lang: string, surah: number): Record<string, string> {
  const rows = db.prepare('SELECT location, text FROM word_langs WHERE lang = ? AND location LIKE ?')
    .all(lang, `${surah}:%`) as unknown as { location: string; text: string }[];
  return Object.fromEntries(rows.map((r) => [r.location, r.text]));
}

export function getTimings(reciter: string, surah: number): AyahTiming[] {
  const rows = db.prepare('SELECT ayah, segments FROM timings WHERE reciter = ? AND surah = ? ORDER BY ayah')
    .all(reciter, surah) as unknown as { ayah: number; segments: string }[];
  return rows.map((r) => ({ ayah: r.ayah, segments: JSON.parse(r.segments) }));
}

export function isValidReciter(slug: string): boolean {
  return getReciters().some((r) => r.slug === slug);
}

// ---- Öğren bölümü: harekesiz eşleşmeyle örnek kelime bulma ----
const AR_MARKS = /[ً-ٰٟۖ-ۭـٕٓٔ]/g;
const normalizeAr = (s: string) => s
  .replace(AR_MARKS, '')
  .replaceAll('ٱ', 'ا').replaceAll('أ', 'ا').replaceAll('إ', 'ا').replaceAll('آ', 'ا')
  .replaceAll('ؤ', 'و').replaceAll('ئ', 'ي');

export type OgrenWord = { loc: string; ar: string; tr: string | null };
let ogrenIdx: { byText: Map<string, OgrenWord>; byLetter: Map<string, OgrenWord> } | null = null;

function buildOgrenIndex() {
  if (ogrenIdx) return ogrenIdx;
  const rows = db.prepare('SELECT location, text_uthmani, tr FROM words ORDER BY id')
    .all() as unknown as { location: string; text_uthmani: string; tr: string | null }[];
  const byText = new Map<string, OgrenWord>();
  const bestScore = new Map<string, number>();
  const byLetter = new Map<string, OgrenWord>();
  for (const r of rows) {
    const n = normalizeAr(r.text_uthmani);
    if (!n) continue;
    if (!byText.has(n)) byText.set(n, { loc: r.location, ar: r.text_uthmani, tr: r.tr });
    // Harf örneği: 3-5 harfli, mushafta erken geçen kelimeler tercih edilir
    const score = Math.abs(4 - n.length);
    const cur = bestScore.get(n[0]);
    if (cur === undefined || score < cur) {
      bestScore.set(n[0], score);
      byLetter.set(n[0], { loc: r.location, ar: r.text_uthmani, tr: r.tr });
    }
  }
  ogrenIdx = { byText, byLetter };
  return ogrenIdx;
}

export function ogrenLookup(texts: string[], letters: string[]): {
  texts: Record<string, OgrenWord | null>; letters: Record<string, OgrenWord | null>;
} {
  const idx = buildOgrenIndex();
  const outT: Record<string, OgrenWord | null> = {};
  for (const t of texts.slice(0, 60)) {
    const n = normalizeAr(t.trim());
    // Tam eşleşme yoksa (çok kelimeli örnekler) ilk eşleşen kelimeyi dene
    outT[t] = idx.byText.get(n) ?? n.split(' ').map((p) => idx.byText.get(p)).find(Boolean) ?? null;
  }
  const outL: Record<string, OgrenWord | null> = {};
  for (const l of letters.slice(0, 40)) {
    outL[l] = idx.byLetter.get(normalizeAr(l)[0] ?? '') ?? null;
  }
  return { texts: outT, letters: outL };
}

// ---- Arama ----
// SQLite LIKE Türkçe harflerde büyük/küçük ayrımı yapar; birkaç varyantla arıyoruz.
export type SearchResults = {
  surahs: (Surah & { matchedAyah?: number })[];
  direct: { key: string; meal: string } | null;
  meals: { verse_key: string; lang: string; snippet: string }[];
  words: { location: string; ar: string; tr: string }[];
};

function likeVariants(q: string): string[] {
  const set = new Set([q, q.toLocaleLowerCase('tr'), q.toLocaleUpperCase('tr'),
    q.charAt(0).toLocaleUpperCase('tr') + q.slice(1).toLocaleLowerCase('tr')]);
  return [...set];
}

function snippetAround(text: string, q: string, radius = 60): string {
  const plain = text.replace(/<[^>]+>/g, '');
  const idx = plain.toLocaleLowerCase('tr').indexOf(q.toLocaleLowerCase('tr'));
  if (idx < 0) return plain.slice(0, radius * 2) + '…';
  const start = Math.max(0, idx - radius);
  const end = Math.min(plain.length, idx + q.length + radius);
  return `${start > 0 ? '…' : ''}${plain.slice(start, end)}${end < plain.length ? '…' : ''}`;
}

export function search(qRaw: string): SearchResults {
  const q = qRaw.trim().slice(0, 80);
  const out: SearchResults = { surahs: [], direct: null, meals: [], words: [] };
  if (q.length < 2) return out;

  // Doğrudan referans: "2:255" veya "2 255"
  const ref = /^(\d{1,3})[:\s](\d{1,3})$/.exec(q);
  if (ref) {
    const key = `${Number(ref[1])}:${Number(ref[2])}`;
    const row = db.prepare("SELECT text FROM translations WHERE verse_key = ? AND lang = 'tr'").get(key) as
      unknown as { text: string } | undefined;
    if (row) out.direct = { key, meal: stripNotes(row.text) };
  }

  // Sure adı (JS'te Türkçe-duyarlı): "bakara", "bakara 255", "yasin"
  const nameMatch = /^(.+?)(?:\s+(\d{1,3}))?$/.exec(q);
  if (nameMatch) {
    const namePart = nameMatch[1].toLocaleLowerCase('tr');
    const ayahPart = nameMatch[2] ? Number(nameMatch[2]) : undefined;
    out.surahs = getSurahs()
      .filter((s) =>
        s.name_tr.toLocaleLowerCase('tr').includes(namePart) ||
        s.name_simple.toLowerCase().includes(namePart) ||
        s.name_en.toLowerCase().includes(namePart))
      .slice(0, 8)
      .map((s) => (ayahPart && ayahPart >= 1 && ayahPart <= s.verses_count ? { ...s, matchedAyah: ayahPart } : s));
  }

  // Meal metni (TR + EN) ve kelime anlamları
  const variants = likeVariants(q).map((v) => `%${v}%`);
  const mealRows = new Map<string, { verse_key: string; lang: string; text: string }>();
  for (const pattern of variants) {
    const rows = db.prepare(
      "SELECT verse_key, lang, text FROM translations WHERE lang IN ('tr','en') AND text LIKE ? LIMIT 40",
    ).all(pattern) as unknown as { verse_key: string; lang: string; text: string }[];
    for (const r of rows) mealRows.set(`${r.verse_key}:${r.lang}`, r);
    if (mealRows.size >= 40) break;
  }
  out.meals = [...mealRows.values()].slice(0, 40)
    .map((r) => ({ verse_key: r.verse_key, lang: r.lang, snippet: snippetAround(r.text, q) }));

  const wordRows = new Map<string, { location: string; text_uthmani: string; tr: string }>();
  for (const pattern of variants) {
    const rows = db.prepare(
      'SELECT location, text_uthmani, tr FROM words WHERE tr LIKE ? LIMIT 30',
    ).all(pattern) as unknown as { location: string; text_uthmani: string; tr: string }[];
    for (const r of rows) wordRows.set(r.location, r);
    if (wordRows.size >= 30) break;
  }
  out.words = [...wordRows.values()].slice(0, 30)
    .map((r) => ({ location: r.location, ar: r.text_uthmani, tr: r.tr }));

  return out;
}
