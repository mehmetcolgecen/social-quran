// Cüz mp3'lerini ayet dosyalarına böler (M. Emin Ay tipi: dosya = 1 cüz).
// Kullanım: node split-cuz-reciter.mjs <şablon(NN içerir)> <hedefDizin> <cüz...|all>
//   örn: node split-cuz-reciter.mjs "/home/mehmet/Downloads/Mehmet-Emin-Ay/Mehmet-Emin-Ay-cuzNN_64kb.mp3" out all
// Çıktı: hedefDizin/SSSAAA.mp3 + timings/SSS.json (sure bazında birleştirilir) + timings/cuzNN.done
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const S = process.env.ALIGN_WORKDIR ?? '/tmp/align-work';
const FFMPEG = process.env.FFMPEG_BIN ?? 'ffmpeg';
const PY = process.env.ALIGN_PYTHON ?? 'python3';
const DBP = new URL('../../../data/processed/quran.db', import.meta.url).pathname;

const [srcTemplate, outDir, ...cuzArgs] = process.argv.slice(2);
const db = new DatabaseSync(DBP, { readOnly: true });
const cuzList = cuzArgs[0] === 'all' ? Array.from({ length: 30 }, (_, i) => i + 1) : cuzArgs.map(Number);

const basmalaWords = db.prepare(
  'SELECT text_imlaei FROM words WHERE surah=1 AND ayah=1 ORDER BY position').all().map((r) => r.text_imlaei);

mkdirSync(`${outDir}/timings`, { recursive: true });
const pad2 = (n) => String(n).padStart(2, '0');
const pad3 = (n) => String(n).padStart(3, '0');

for (const cuz of cuzList) {
  const src = srcTemplate.replace('NN', pad2(cuz));
  const marker = `${outDir}/timings/cuz${pad2(cuz)}.done`;
  if (existsSync(marker)) { console.log(`cüz ${cuz}: zaten bölünmüş, atlandı`); continue; }
  if (!existsSync(src)) { console.error(`cüz ${cuz}: kaynak yok (${src})`); continue; }

  const ayahRows = db.prepare(
    'SELECT surah, ayah FROM ayahs WHERE juz=? ORDER BY surah, ayah').all(cuz);
  const words = db.prepare(
    'SELECT surah, ayah, text_imlaei FROM words WHERE surah||\':\'||ayah IN ' +
    `(SELECT surah||':'||ayah FROM ayahs WHERE juz=?) ORDER BY surah, ayah, position`).all(cuz);
  const byKey = new Map();
  for (const w of words) {
    const k = `${w.surah}:${w.ayah}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(w.text_imlaei);
  }
  const items = ayahRows.map(({ surah, ayah }, i) => {
    const k = `${surah}:${ayah}`;
    const ws = byKey.get(k);
    // Besmele: sure başında her zaman; cüz ortasından başlıyorsa İLK öğeye
    // belirsiz önek olarak eklenir (python skorla karar verir)
    const surahStart = ayah === 1 && surah !== 1 && surah !== 9;
    const cuzMidStart = i === 0 && ayah !== 1;
    if (surahStart || cuzMidStart) {
      return { key: k, words: [...basmalaWords, ...ws], drop_prefix: basmalaWords.length,
               ...(cuzMidStart ? { probe_prefix: true } : {}) };
    }
    return { key: k, words: ws, drop_prefix: 0 };
  });

  const segPath = `${S}/seg-cuz${cuz}.json`;
  const alnPath = `${S}/aln-cuz${cuz}.json`;
  writeFileSync(segPath, JSON.stringify({ istiaze: true, items }));
  console.log(`cüz ${cuz}: hizalanıyor (${items.length} ayet)…`);
  const t0 = Date.now();
  execFileSync(PY, [`${new URL('.', import.meta.url).pathname}align-quran.py`, src, segPath, alnPath], { stdio: ['ignore', 'inherit', 'inherit'] });
  const aln = JSON.parse(readFileSync(alnPath, 'utf8'));

  const n = aln.items.length;
  const bounds = [];
  let start = aln.start_cut_ms ?? aln.istiaze_ms ?? 0;
  for (let i = 0; i < n; i++) {
    let end = aln.items[i].cut_ms ?? aln.total_ms;
    if (end <= start) end = Math.min(aln.items[i].end_ms + 200, aln.total_ms);
    // Kesimler monoton olmalı (bkz. split-local-reciter 15:76 vakası)
    end = Math.min(Math.max(end, start + 150), aln.total_ms);
    if (end <= start) end = aln.total_ms;
    bounds.push([start, end]);
    start = end;
  }

  const bySurah = new Map();
  const lowScores = [];
  for (let i = 0; i < n; i++) {
    const it = aln.items[i];
    let [b0, b1] = bounds[i];
    // Sıfır/negatif aralık ffmpeg'i düşürür — asgari 200 ms garanti et
    if (b1 - b0 < 60) { b1 = Math.min(aln.total_ms, b0 + 200); if (b1 - b0 < 60) b0 = Math.max(0, b1 - 200); }
    const [ss, aa] = it.key.split(':').map(Number);
    const dst = `${outDir}/${pad3(ss)}${pad3(aa)}.mp3`;
    execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y',
      '-ss', (b0 / 1000).toFixed(3), '-to', (b1 / 1000).toFixed(3),
      '-i', src, '-c', 'copy', dst]);
    if (!bySurah.has(ss)) bySurah.set(ss, {});
    bySurah.get(ss)[aa] = { score: it.score, words: it.words.map(([p, ws, we]) => [p, Math.max(0, ws - b0), Math.max(0, we - b0)]) };
    if (it.score < -5) lowScores.push(`${it.key}(${it.score})`);
  }
  // Sure zamanlama dosyalarına BİRLEŞTİREREK yaz (sure iki cüze yayılabilir)
  for (const [ss, timings] of bySurah) {
    const tf = `${outDir}/timings/${pad3(ss)}.json`;
    const prev = existsSync(tf) ? JSON.parse(readFileSync(tf, 'utf8')).timings : {};
    writeFileSync(tf, JSON.stringify({ surah: ss, timings: { ...prev, ...timings } }));
  }
  writeFileSync(marker, JSON.stringify({ cuz, istiaze_ms: aln.istiaze_ms, ayah_count: n }));
  const dt = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`cüz ${cuz}: ${n} ayet kesildi (${dt}s)${lowScores.length ? ` — DÜŞÜK SKOR: ${lowScores.join(', ')}` : ''}`);
}
console.log('Bitti.');
