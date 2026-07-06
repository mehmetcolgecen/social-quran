// İşlenmiş veritabanı üretimi: data/processed/quran.db (node:sqlite, yerel geliştirme)
// + data/processed/seed.sql.gz (PostgreSQL COPY formatı, CNPG'ye Faz 4'te yüklenir).
import { DatabaseSync } from 'node:sqlite';
import { rm, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { PROCESSED, RAW, RECITERS, ensureDir, parseTanzil, readJSON } from './lib.mjs';

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
    ayah INTEGER NOT NULL, text_uthmani TEXT NOT NULL, page INTEGER NOT NULL,
    juz INTEGER NOT NULL, hizb INTEGER NOT NULL, sajdah INTEGER);
  CREATE TABLE words (
    id INTEGER PRIMARY KEY, location TEXT NOT NULL UNIQUE, surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL, position INTEGER NOT NULL, text_uthmani TEXT NOT NULL,
    page INTEGER NOT NULL, line INTEGER NOT NULL, tr TEXT, en TEXT, transliteration TEXT);
  CREATE TABLE translations (
    verse_key TEXT NOT NULL, lang TEXT NOT NULL, source TEXT NOT NULL, text TEXT NOT NULL,
    PRIMARY KEY (verse_key, lang));
  CREATE TABLE reciters (slug TEXT PRIMARY KEY, name TEXT NOT NULL);
  CREATE TABLE timings (
    reciter TEXT NOT NULL REFERENCES reciters(slug), surah INTEGER NOT NULL, ayah INTEGER NOT NULL,
    segments TEXT NOT NULL, PRIMARY KEY (reciter, surah, ayah));
  CREATE INDEX idx_words_verse ON words(surah, ayah);
  CREATE INDEX idx_words_page ON words(page);
  CREATE INDEX idx_ayahs_page ON ayahs(page);
`);

// Postgres seed için satırları biriktir (COPY text formatı)
const pg = { surahs: [], ayahs: [], words: [], translations: [], reciters: [], timings: [] };
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
const insAyah = db.prepare('INSERT INTO ayahs VALUES (?,?,?,?,?,?,?,?,?)');
const insWord = db.prepare('INSERT INTO words VALUES (?,?,?,?,?,?,?,?,?,?,?)');
const insTrans = db.prepare('INSERT INTO translations VALUES (?,?,?,?)');
let ayahId = 0, wordId = 0;
// Yorum hedefi doğrulaması için limitler (API kullanır): sure→ayet sayısı, ayet→kelime sayısı
const targetLimits = { pages: 604, surahs: {}, ayahWords: {} };
for (const c of chaptersEn) targetLimits.surahs[c.id] = c.verses_count;

for (let ch = 1; ch <= 114; ch++) {
  const pad = String(ch).padStart(3, '0');
  const { verses: versesEn } = await readJSON(`${RAW}qdc/words-en/${pad}.json`);
  const { verses: versesTr } = await readJSON(`${RAW}qdc/words-tr/${pad}.json`);
  const trByKey = new Map(versesTr.map((v) => [v.verse_key, v]));
  for (const v of versesEn) {
    const vTr = trByKey.get(v.verse_key);
    const [s, a] = v.verse_key.split(':').map(Number);
    const text = tanzilByKey.get(v.verse_key);
    if (!text) throw new Error(`Tanzil metni yok: ${v.verse_key}`);
    const wordsEn = v.words.filter((w) => w.char_type_name === 'word');
    const wordsTr = vTr.words.filter((w) => w.char_type_name === 'word');
    if (wordsEn.length !== wordsTr.length) throw new Error(`kelime sayısı uyuşmuyor: ${v.verse_key}`);
    targetLimits.ayahWords[v.verse_key] = wordsEn.length;
    const aVals = [++ayahId, v.verse_key, s, a, text, wordsEn[0].page_number, v.juz_number, v.hizb_number, v.sajdah_number ?? null];
    insAyah.run(...aVals); row('ayahs', aVals);
    wordsEn.forEach((w, i) => {
      const wVals = [++wordId, w.location, s, a, i + 1, w.text_uthmani, w.page_number, w.line_number,
        wordsTr[i].translation?.text ?? null, w.translation?.text ?? null, w.transliteration?.text ?? null];
      insWord.run(...wVals); row('words', wVals);
    });
    const tVals = [
      [v.verse_key, 'tr', 'Elmalılı Hamdi Yazır', vTr.translations[0].text],
      [v.verse_key, 'en', 'Saheeh International', v.translations[0].text],
    ];
    for (const t of tVals) { insTrans.run(...t); row('translations', t); }
  }
}

const insReciter = db.prepare('INSERT INTO reciters VALUES (?,?)');
const insTiming = db.prepare('INSERT INTO timings VALUES (?,?,?,?)');
for (const { slug, name, align } of RECITERS) {
  insReciter.run(slug, name); row('reciters', [slug, name]);
  for (const e of await readJSON(`${RAW}quran-align/${align}.json`)) {
    const vals = [slug, e.surah, e.ayah, JSON.stringify(e.segments)];
    insTiming.run(...vals); row('timings', vals);
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
CREATE TABLE ayahs (id INT PRIMARY KEY, verse_key TEXT NOT NULL UNIQUE, surah INT NOT NULL REFERENCES surahs(id), ayah INT NOT NULL, text_uthmani TEXT NOT NULL, page INT NOT NULL, juz INT NOT NULL, hizb INT NOT NULL, sajdah INT);
CREATE TABLE words (id INT PRIMARY KEY, location TEXT NOT NULL UNIQUE, surah INT NOT NULL, ayah INT NOT NULL, position INT NOT NULL, text_uthmani TEXT NOT NULL, page INT NOT NULL, line INT NOT NULL, tr TEXT, en TEXT, transliteration TEXT);
CREATE TABLE translations (verse_key TEXT NOT NULL, lang TEXT NOT NULL, source TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (verse_key, lang));
CREATE TABLE reciters (slug TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE timings (reciter TEXT NOT NULL REFERENCES reciters(slug), surah INT NOT NULL, ayah INT NOT NULL, segments JSONB NOT NULL, PRIMARY KEY (reciter, surah, ayah));
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
console.log(`Üretildi: ${DB_PATH} + ${PROCESSED}seed.sql.gz + target-limits.json`);
