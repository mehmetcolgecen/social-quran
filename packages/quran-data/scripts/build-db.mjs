// İşlenmiş veritabanı üretimi: data/processed/quran.db (node:sqlite, yerel geliştirme)
// + data/processed/seed.sql.gz (PostgreSQL COPY formatı, CNPG'ye Faz 4'te yüklenir).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { AUDIO, PROCESSED, RAW, RECITERS, ensureDir, parseTanzil, readAlign, readJSON } from './lib.mjs';

// Kelime-kelime TR yamaları: kaynak veri setinde (quran.com wbw-tr) Türkçesi eksik olup
// İngilizce'ye düşen glosslar, patches/wbw-tr-*.json ile makine çevirisinden tamamlanır.
// Kur'an metnine DOKUNMAZ; yalnız words.tr sütununu, tr==en olduğunda düzeltir.
const PATCH_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../patches');
const wbwTrPatch = new Map();
for (const f of readdirSync(PATCH_DIR).filter((f) => /^wbw-tr-.*\.json$/.test(f)).sort()) {
  for (const [en, tr] of Object.entries(JSON.parse(readFileSync(path.join(PATCH_DIR, f), 'utf8')))) {
    wbwTrPatch.set(en, tr);
  }
}
let wbwTrPatched = 0;
function fixWordTr(tr, en) {
  if (tr != null && en != null && tr.toLowerCase() === en.toLowerCase()) {
    const fixed = wbwTrPatch.get(en);
    if (fixed !== undefined && fixed !== tr) { wbwTrPatched++; return fixed; }
  }
  return tr;
}

await ensureDir(PROCESSED);
const DB_PATH = `${PROCESSED}quran.db`;
await rm(DB_PATH, { force: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE surahs (
    id INTEGER PRIMARY KEY, name_arabic TEXT NOT NULL, name_simple TEXT NOT NULL,
    name_tr TEXT NOT NULL, name_en TEXT NOT NULL, revelation_place TEXT NOT NULL,
    verses_count INTEGER NOT NULL);
  CREATE TABLE ayahs (
    id INTEGER PRIMARY KEY, verse_key TEXT NOT NULL UNIQUE, surah INTEGER NOT NULL REFERENCES surahs(id),
    ayah INTEGER NOT NULL, text_uthmani TEXT NOT NULL, text_imlaei TEXT NOT NULL, page INTEGER NOT NULL,
    juz INTEGER NOT NULL, hizb INTEGER NOT NULL, sajdah INTEGER);
  CREATE TABLE words (
    id INTEGER PRIMARY KEY, location TEXT NOT NULL UNIQUE, surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL, position INTEGER NOT NULL, text_uthmani TEXT NOT NULL,
    text_imlaei TEXT NOT NULL, page INTEGER NOT NULL, line INTEGER NOT NULL,
    tr TEXT, en TEXT, transliteration TEXT);
  CREATE TABLE translations (
    verse_key TEXT NOT NULL, lang TEXT NOT NULL, source TEXT NOT NULL, text TEXT NOT NULL,
    PRIMARY KEY (verse_key, lang));
  CREATE TABLE reciters (slug TEXT PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE timings (
    reciter TEXT NOT NULL REFERENCES reciters(slug), surah INTEGER NOT NULL, ayah INTEGER NOT NULL,
    segments TEXT NOT NULL, PRIMARY KEY (reciter, surah, ayah));
  CREATE TABLE word_langs (
    location TEXT NOT NULL, lang TEXT NOT NULL, text TEXT NOT NULL,
    PRIMARY KEY (location, lang));
  CREATE INDEX idx_words_verse ON words(surah, ayah);
  CREATE INDEX idx_words_page ON words(page);
  CREATE INDEX idx_ayahs_page ON ayahs(page);
  CREATE INDEX idx_translations_lang ON translations(lang);
`);

// Postgres seed için satırları biriktir (COPY text formatı)
const pg = { surahs: [], ayahs: [], words: [], translations: [], reciters: [], timings: [], word_langs: [] };
const esc = (v) => v == null ? '\\N' : String(v).replaceAll('\\', '\\\\').replaceAll('\t', '\\t').replaceAll('\n', '\\n').replaceAll('\r', '\\r');
const row = (table, vals) => pg[table].push(vals.map(esc).join('\t'));

db.exec('BEGIN');

const chaptersTr = (await readJSON(`${RAW}qdc/chapters-tr.json`)).chapters;
const chaptersEn = (await readJSON(`${RAW}qdc/chapters-en.json`)).chapters;
const insSurah = db.prepare('INSERT INTO surahs VALUES (?,?,?,?,?,?,?)');
for (const c of chaptersEn) {
  const tr = chaptersTr.find((x) => x.id === c.id);
  const vals = [c.id, c.name_arabic, c.name_simple, tr.translated_name.name, c.translated_name.name, c.revelation_place, c.verses_count];
  insSurah.run(...vals);
  row('surahs', vals);
}

const tanzilByKey = new Map((await parseTanzil()).map((a) => [`${a.surah}:${a.ayah}`, a.text]));
const insAyah = db.prepare('INSERT INTO ayahs VALUES (?,?,?,?,?,?,?,?,?,?)');
const insWord = db.prepare('INSERT INTO words VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
const insTrans = db.prepare('INSERT INTO translations VALUES (?,?,?,?)');
let ayahId = 0, wordId = 0;
// Yorum hedefi doğrulaması için limitler (API kullanır): sure→ayet sayısı, ayet→kelime sayısı
const targetLimits = { pages: 604, surahs: {}, ayahWords: {} };
for (const c of chaptersEn) targetLimits.surahs[c.id] = c.verses_count;

for (let ch = 1; ch <= 114; ch++) {
  const pad = String(ch).padStart(3, '0');
  const { verses: versesEn } = await readJSON(`${RAW}qdc/words-en/${pad}.json`);
  const { verses: versesTr } = await readJSON(`${RAW}qdc/words-tr/${pad}.json`);
  const { verses: versesImla } = await readJSON(`${RAW}qdc/imlaei/${pad}.json`);
  const trByKey = new Map(versesTr.map((v) => [v.verse_key, v]));
  // İmlâî metin (görüntüleme varsayılanı): ayet metni + konum→kelime haritası
  const imlaByKey = new Map(versesImla.map((v) => [v.verse_key, v]));
  for (const v of versesEn) {
    const vTr = trByKey.get(v.verse_key);
    const vImla = imlaByKey.get(v.verse_key);
    const [s, a] = v.verse_key.split(':').map(Number);
    const text = tanzilByKey.get(v.verse_key);
    if (!text) throw new Error(`Tanzil metni yok: ${v.verse_key}`);
    if (!vImla?.text_imlaei) throw new Error(`İmlâî metin yok: ${v.verse_key}`);
    const imlaWords = new Map(vImla.words.filter((w) => w.char_type_name === 'word').map((w) => [w.location, w.text_imlaei]));
    const wordsEn = v.words.filter((w) => w.char_type_name === 'word');
    const wordsTr = vTr.words.filter((w) => w.char_type_name === 'word');
    if (wordsEn.length !== wordsTr.length) throw new Error(`kelime sayısı uyuşmuyor: ${v.verse_key}`);
    targetLimits.ayahWords[v.verse_key] = wordsEn.length;
    const aVals = [++ayahId, v.verse_key, s, a, text, vImla.text_imlaei, wordsEn[0].page_number, v.juz_number, v.hizb_number, v.sajdah_number ?? null];
    insAyah.run(...aVals); row('ayahs', aVals);
    wordsEn.forEach((w, i) => {
      const en = w.translation?.text ?? null;
      const tr = fixWordTr(wordsTr[i].translation?.text ?? null, en);
      const imla = imlaWords.get(w.location);
      if (!imla) throw new Error(`İmlâî kelime yok: ${w.location}`);
      const wVals = [++wordId, w.location, s, a, i + 1, w.text_uthmani, imla, w.page_number, w.line_number,
        tr, en, w.transliteration?.text ?? null];
      insWord.run(...wVals); row('words', wVals);
    });
    const tVals = [
      [v.verse_key, 'tr', 'Elmalılı Hamdi Yazır', vTr.translations[0].text],
      [v.verse_key, 'en', 'Saheeh International', v.translations[0].text],
    ];
    for (const t of tVals) { insTrans.run(...t); row('translations', t); }
  }
}

// Ek meal dilleri: /quran/translations yanıtı ayet (verse id) sırasındadır → sıra tanzil sırasıyla eş
const verseKeysInOrder = [...tanzilByKey.keys()];
for (const f of readdirSync(`${RAW}qdc`).filter((x) => /^translation-\w+\.json$/.test(x))) {
  const { lang, source, translations } = await readJSON(`${RAW}qdc/${f}`);
  if (translations.length !== 6236) throw new Error(`${f}: ${translations.length} != 6236`);
  translations.forEach((t, i) => {
    const vals = [verseKeysInOrder[i], lang, source, t.text];
    insTrans.run(...vals);
    row('translations', vals);
  });
  console.log(`meal-${lang} yüklendi (${source})`);
}

// Ek kelime-kelime diller (ur/hi) → word_langs
const insWordLang = db.prepare('INSERT INTO word_langs VALUES (?,?,?)');
for (const lang of ['ur', 'hi']) {
  let count = 0;
  for (let ch = 1; ch <= 114; ch++) {
    const pad = String(ch).padStart(3, '0');
    const { verses } = await readJSON(`${RAW}qdc/words-${lang}/${pad}.json`);
    for (const v of verses) {
      for (const w of v.words.filter((x) => x.char_type_name === 'word')) {
        const text = w.translation?.text ?? '';
        if (!text) continue;
        insWordLang.run(w.location, lang, text);
        row('word_langs', [w.location, lang, text]);
        count++;
      }
    }
  }
  if (count < 77000) throw new Error(`word_langs ${lang}: ${count} kelime — eksik`);
  console.log(`kelime-${lang} yüklendi (${count})`);
}

const insReciter = db.prepare('INSERT INTO reciters VALUES (?,?)');
const insTiming = db.prepare('INSERT INTO timings VALUES (?,?,?,?)');
for (const { slug, name, align, local } of RECITERS) {
  if (local) {
    // Yerel kâri: ayet mp3'leri elle sağlanır — tam set yoksa listeye girmez
    let files = [];
    try { files = readdirSync(`${AUDIO}${slug}`).filter((f) => /^\d{6}\.mp3$/.test(f)); } catch { /* dizin yok */ }
    if (files.length !== 6236) { console.log(`${slug}: yerel ses ${files.length}/6236 — kâri ATLANDI`); continue; }
  }
  insReciter.run(slug, name); row('reciters', [slug, name]);
  if (align) {
    let skipped = 0;
    for (const e of await readAlign(`${RAW}quran-align/${align}.json`)) {
      // quran-align bazı ayetlerde hizalama hatası kaydı bırakır (segments dizi değildir) → atla
      if (!Array.isArray(e.segments) || e.segments.length === 0) { skipped++; continue; }
      const vals = [slug, e.surah, e.ayah, JSON.stringify(e.segments)];
      insTiming.run(...vals); row('timings', vals);
    }
    if (skipped) console.log(`${slug}: ${skipped} ayette kelime zamanlaması yok (ayet takibiyle çalınır)`);
    continue;
  }
  // Yerel MMS hizalama zamanlamaları (data/audio/<slug>/timings/SSS.json) — varsa yüklenir
  const tdir = `${AUDIO}${slug}/timings`;
  if (local && existsSync(tdir)) {
    let n = 0, low = 0;
    for (const f of readdirSync(tdir).filter((x) => /^\d{3}\.json$/.test(x))) {
      const { surah, timings } = JSON.parse(readFileSync(`${tdir}/${f}`, 'utf8'));
      for (const [ayah, t] of Object.entries(timings)) {
        // Düşük hizalama skoru = güvenilmez kelime takibi → ayet takibine düş
        // (MMS_FA jeton log-olasılık ölçeğinde -2..-3.5 normaldir; -5.5 altı şüpheli)
        if (!Array.isArray(t.words) || t.words.length === 0 || t.score < -5.5) { low++; continue; }
        const segs = t.words.map(([p, ws, we]) => [p - 1, p, Math.max(0, ws), Math.max(0, we)]);
        const vals = [slug, surah, Number(ayah), JSON.stringify(segs)];
        insTiming.run(...vals); row('timings', vals); n++;
      }
    }
    console.log(`${slug}: ${n} ayette yerel kelime zamanlaması${low ? `, ${low} düşük skorlu ayet takibinde` : ''}`);
  }
}

db.exec('COMMIT');
const counts = {};
for (const t of Object.keys(pg)) counts[t] = db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
db.close();

// PostgreSQL seed (şema + COPY)
const pgSchema = `BEGIN;
DROP TABLE IF EXISTS timings, reciters, translations, words, ayahs, surahs CASCADE;
CREATE TABLE surahs (id INT PRIMARY KEY, name_arabic TEXT NOT NULL, name_simple TEXT NOT NULL, name_tr TEXT NOT NULL, name_en TEXT NOT NULL, revelation_place TEXT NOT NULL, verses_count INT NOT NULL);
CREATE TABLE ayahs (id INT PRIMARY KEY, verse_key TEXT NOT NULL UNIQUE, surah INT NOT NULL REFERENCES surahs(id), ayah INT NOT NULL, text_uthmani TEXT NOT NULL, text_imlaei TEXT NOT NULL, page INT NOT NULL, juz INT NOT NULL, hizb INT NOT NULL, sajdah INT);
CREATE TABLE words (id INT PRIMARY KEY, location TEXT NOT NULL UNIQUE, surah INT NOT NULL, ayah INT NOT NULL, position INT NOT NULL, text_uthmani TEXT NOT NULL, text_imlaei TEXT NOT NULL, page INT NOT NULL, line INT NOT NULL, tr TEXT, en TEXT, transliteration TEXT);
CREATE TABLE translations (verse_key TEXT NOT NULL, lang TEXT NOT NULL, source TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (verse_key, lang));
CREATE TABLE reciters (slug TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE timings (reciter TEXT NOT NULL REFERENCES reciters(slug), surah INT NOT NULL, ayah INT NOT NULL, segments JSONB NOT NULL, PRIMARY KEY (reciter, surah, ayah));
CREATE TABLE word_langs (location TEXT NOT NULL, lang TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (location, lang));
`;
const copyBlocks = Object.entries(pg)
  .map(([t, rows]) => `COPY ${t} FROM stdin;\n${rows.join('\n')}\n\\.\n`).join('');
const indexes = `CREATE INDEX idx_words_verse ON words(surah, ayah);
CREATE INDEX idx_words_page ON words(page);
CREATE INDEX idx_ayahs_page ON ayahs(page);
COMMIT;
`;
await writeFile(`${PROCESSED}seed.sql.gz`, gzipSync(pgSchema + copyBlocks + indexes));
await writeFile(`${PROCESSED}target-limits.json`, JSON.stringify(targetLimits));

console.log('Tablo satır sayıları:', JSON.stringify(counts));
console.log(`wbw-tr yaması: ${wbwTrPatched} kelime glossu Türkçeleştirildi (${wbwTrPatch.size} kayıtlı çeviri).`);
console.log(`Üretildi: ${DB_PATH} + ${PROCESSED}seed.sql.gz + target-limits.json`);
