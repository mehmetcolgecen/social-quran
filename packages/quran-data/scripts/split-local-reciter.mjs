// Sure mp3'lerini ayet dosyalarına böler (İshak Danış tipi: dosya = 1 sure).
// Kullanım: node split-reciter.mjs <kaynakDizin> <hedefDizin> <sure...|all>
// Çıktı: hedefDizin/SSSAAA.mp3 + hedefDizin/timings/SSS.json (kelime zamanları)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const S = process.env.ALIGN_WORKDIR ?? '/tmp/align-work';
const FFMPEG = process.env.FFMPEG_BIN ?? 'ffmpeg';
const PY = process.env.ALIGN_PYTHON ?? 'python3';
const DBP = new URL('../../../data/processed/quran.db', import.meta.url).pathname;

const [srcDir, outDir, ...surahArgs] = process.argv.slice(2);
const db = new DatabaseSync(DBP, { readOnly: true });
const surahs = surahArgs[0] === 'all'
  ? Array.from({ length: 114 }, (_, i) => i + 1)
  : surahArgs.map(Number);

const basmalaWords = db.prepare(
  'SELECT text_imlaei FROM words WHERE surah=1 AND ayah=1 ORDER BY position').all().map((r) => r.text_imlaei);

mkdirSync(`${outDir}/timings`, { recursive: true });
const pad3 = (n) => String(n).padStart(3, '0');

for (const s of surahs) {
  const src = `${srcDir}/${pad3(s)}.mp3`;
  const marker = `${outDir}/timings/${pad3(s)}.json`;
  if (existsSync(marker)) { console.log(`${s}: zaten bölünmüş, atlandı`); continue; }
  if (!existsSync(src)) { console.error(`${s}: kaynak yok (${src})`); continue; }

  const rows = db.prepare(
    'SELECT ayah, position, text_imlaei FROM words WHERE surah=? ORDER BY ayah, position').all(s);
  const byAyah = new Map();
  for (const r of rows) {
    if (!byAyah.has(r.ayah)) byAyah.set(r.ayah, []);
    byAyah.get(r.ayah).push(r.text_imlaei);
  }
  const items = [...byAyah.entries()].map(([ayah, words]) => {
    const withB = ayah === 1 && s !== 1 && s !== 9;
    return {
      key: `${s}:${ayah}`,
      words: withB ? [...basmalaWords, ...words] : words,
      drop_prefix: withB ? basmalaWords.length : 0,
    };
  });

  const segPath = `${S}/seg-${s}.json`;
  const alnPath = `${S}/aln-${s}.json`;
  writeFileSync(segPath, JSON.stringify({ istiaze: true, items }));
  console.log(`${s}: hizalanıyor (${items.length} ayet)…`);
  const t0 = Date.now();
  execFileSync(PY, [`${new URL('.', import.meta.url).pathname}align-quran.py`, src, segPath, alnPath], { stdio: ['ignore', 'inherit', 'inherit'] });
  const aln = JSON.parse(readFileSync(alnPath, 'utf8'));

  // Kesim sınırları: hizalayıcının enerji-minimumuna oturttuğu cut_ms değerleri
  const n = aln.items.length;
  const bounds = [];
  let start = aln.start_cut_ms ?? aln.istiaze_ms ?? 0;
  for (let i = 0; i < n; i++) {
    let end = aln.items[i].cut_ms ?? aln.total_ms;
    if (end <= start) end = Math.min(aln.items[i].end_ms + 200, aln.total_ms);
    bounds.push([start, end]);
    start = end;
  }

  const timings = {};
  const lowScores = [];
  for (let i = 0; i < n; i++) {
    const it = aln.items[i];
    const [b0, b1] = bounds[i];
    const [ss, aa] = it.key.split(':').map(Number);
    const dst = `${outDir}/${pad3(ss)}${pad3(aa)}.mp3`;
    execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y',
      '-ss', (b0 / 1000).toFixed(3), '-to', (b1 / 1000).toFixed(3),
      '-i', src, '-c', 'copy', dst]);
    // Kelime zamanları ayet dosyası içine göre (ms)
    timings[aa] = { score: it.score, words: it.words.map(([p, ws, we]) => [p, Math.max(0, ws - b0), Math.max(0, we - b0)]) };
    if (it.score < -5) lowScores.push(`${it.key}(${it.score})`);
  }
  writeFileSync(marker, JSON.stringify({ surah: s, istiaze_ms: aln.istiaze_ms, timings }));
  const dt = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`${s}: ${n} ayet kesildi (${dt}s)${lowScores.length ? ` — DÜŞÜK SKOR: ${lowScores.join(', ')}` : ''}`);
}
console.log('Bitti.');
