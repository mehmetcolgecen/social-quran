// Ayet-dosyalı kâri için kelime zamanlaması üretir (everyayah düzeni: SSSAAA.mp3).
// Kullanım: node timings-reciter.mjs <sesDizin> <sure...|all>
//   ortam: ALIGN_PYTHON (venv python), ALIGN_WORKDIR (geçici json'lar), FFMPEG_BIN
// Çıktı: <sesDizin>/timings/SSS.json (build-db bunları timings tablosuna alır)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const S = process.env.ALIGN_WORKDIR ?? '/tmp/align-work';
const PY = process.env.ALIGN_PYTHON ?? 'python3';
const DBP = new URL('../../../data/processed/quran.db', import.meta.url).pathname;

const [audioDir, ...surahArgs] = process.argv.slice(2);
const db = new DatabaseSync(DBP, { readOnly: true });
const surahs = surahArgs[0] === 'all' ? Array.from({ length: 114 }, (_, i) => i + 1) : surahArgs.map(Number);
const basmalaWords = db.prepare(
  'SELECT text_imlaei FROM words WHERE surah=1 AND ayah=1 ORDER BY position').all().map((r) => r.text_imlaei);
mkdirSync(`${audioDir}/timings`, { recursive: true });
mkdirSync(S, { recursive: true });
const pad3 = (n) => String(n).padStart(3, '0');

for (const s of surahs) {
  const marker = `${audioDir}/timings/${pad3(s)}.json`;
  if (existsSync(marker)) { console.log(`${s}: zaten var, atlandı`); continue; }
  const rows = db.prepare(
    'SELECT ayah, position, text_imlaei FROM words WHERE surah=? ORDER BY ayah, position').all(s);
  const byAyah = new Map();
  for (const r of rows) {
    if (!byAyah.has(r.ayah)) byAyah.set(r.ayah, []);
    byAyah.get(r.ayah).push(r.text_imlaei);
  }
  const items = [];
  for (const [ayah, words] of byAyah) {
    const file = `${audioDir}/${pad3(s)}${pad3(ayah)}.mp3`;
    if (!existsSync(file)) { console.error(`${s}:${ayah} dosya yok`); continue; }
    const withB = ayah === 1 && s !== 1 && s !== 9; // everyayah 1. ayet dosyaları besmeleyle başlar
    items.push({ file, key: `${s}:${ayah}`,
      words: withB ? [...basmalaWords, ...words] : words,
      drop_prefix: withB ? basmalaWords.length : 0 });
  }
  const bPath = `${S}/tbatch-${s}.json`;
  const oPath = `${S}/tout-${s}.json`;
  writeFileSync(bPath, JSON.stringify({ items }));
  console.log(`${s}: hizalanıyor (${items.length} ayet)…`);
  const t0 = Date.now();
  const alignPy = `${new URL('.', import.meta.url).pathname}align-files.py`;
  execFileSync(PY, [alignPy, bPath, oPath], { stdio: ['ignore', 'inherit', 'inherit'] });
  const res = JSON.parse(readFileSync(oPath, 'utf8'));
  const timings = {};
  for (const [key, t] of Object.entries(res)) timings[Number(key.split(':')[1])] = t;
  writeFileSync(marker, JSON.stringify({ surah: s, timings }));
  console.log(`${s}: tamam (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
console.log('Bitti.');
