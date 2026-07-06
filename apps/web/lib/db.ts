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
