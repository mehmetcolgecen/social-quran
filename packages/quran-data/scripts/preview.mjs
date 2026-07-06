// Hızlı yerel önizleme — Faz 0 verisini gözle doğrulamak için tek dosyalık demo.
// Faz 1 uygulamasının yerine geçmez; bağımlılıksız (node:http + node:sqlite).
// Çalıştır: npm run -w packages/quran-data preview  →  http://localhost:4747
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { AUDIO, PROCESSED } from './lib.mjs';

const PORT = 4747;
const db = new DatabaseSync(`${PROCESSED}quran.db`, { readOnly: true });
const qSurahs = db.prepare('SELECT id, name_arabic, name_simple, name_tr, verses_count FROM surahs ORDER BY id');
const qWords = db.prepare('SELECT ayah, position, text_uthmani, tr, en FROM words WHERE surah = ? ORDER BY ayah, position');
const qTrans = db.prepare("SELECT verse_key, lang, text FROM translations WHERE verse_key LIKE ? ");
const qTimings = db.prepare('SELECT ayah, segments FROM timings WHERE reciter = ? AND surah = ?');
const qReciters = db.prepare('SELECT slug, name FROM reciters ORDER BY name');

const stripNotes = (t) => t.replace(/<sup[^>]*>.*?<\/sup>/g, '');

function apiSurah(id, reciter) {
  const words = qWords.all(id);
  const trans = new Map();
  for (const t of qTrans.all(`${id}:%`)) {
    if (!trans.has(t.verse_key)) trans.set(t.verse_key, {});
    trans.get(t.verse_key)[t.lang] = stripNotes(t.text);
  }
  const segs = new Map(qTimings.all(reciter, id).map((r) => [r.ayah, JSON.parse(r.segments)]));
  const ayahs = [];
  for (const w of words) {
    if (!ayahs.length || ayahs.at(-1).ayah !== w.ayah) {
      ayahs.push({ ayah: w.ayah, words: [], meal: trans.get(`${id}:${w.ayah}`) ?? {}, segments: segs.get(w.ayah) ?? [] });
    }
    ayahs.at(-1).words.push({ p: w.position, ar: w.text_uthmani, tr: w.tr, en: w.en });
  }
  return { surah: id, ayahs };
}

function serveAudio(req, res, path) {
  if (!existsSync(path)) { res.writeHead(404); return res.end(); }
  const size = statSync(path).size;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1, 'content-type': 'audio/mpeg' });
    createReadStream(path, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'content-length': size, 'accept-ranges': 'bytes', 'content-type': 'audio/mpeg' });
    createReadStream(path).pipe(res);
  }
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const json = (obj) => { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  let m;
  if (url.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
  if (url.pathname === '/api/meta') return json({ surahs: qSurahs.all(), reciters: qReciters.all() });
  if ((m = /^\/api\/surah\/(\d{1,3})$/.exec(url.pathname))) {
    const id = Number(m[1]);
    if (id < 1 || id > 114) { res.writeHead(400); return res.end(); }
    return json(apiSurah(id, url.searchParams.get('reciter') ?? 'Husary_64kbps'));
  }
  if ((m = /^\/audio\/([A-Za-z0-9_]+)\/(\d{6}\.mp3)$/.exec(url.pathname))) {
    return serveAudio(req, res, `${AUDIO}${m[1]}/${m[2]}`);
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Önizleme hazır: http://localhost:${PORT}`));

const PAGE = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sosyal Kur'an — Önizleme</title>
<style>
  :root { --ink: #1a1a1a; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #faf7f0; color: var(--ink); }
  header { position: sticky; top: 0; background: #fffdf7; border-bottom: 2px solid #d4c9a8; padding: .6rem 1rem; display: flex; gap: .8rem; flex-wrap: wrap; align-items: center; z-index: 2; }
  header label { font-size: .8rem; display: flex; align-items: center; gap: .3rem; }
  select, button { font: inherit; padding: .25rem .5rem; }
  main { max-width: 1100px; margin: 0 auto; padding: 1rem; }
  #legend { display: none; gap: 1rem; font-size: .8rem; padding: .4rem 1rem; background: #fffdf7; border-bottom: 1px solid #d4c9a8; }
  .mahrec #legend { display: flex; flex-wrap: wrap; }
  .ayah { padding: .8rem .6rem; border-radius: .6rem; }
  .ayah.active { background: #f3ecd9; }
  .words { direction: rtl; display: flex; flex-wrap: wrap; gap: .45rem 1.05rem; align-items: flex-end; }
  .w { display: inline-flex; flex-direction: column; align-items: center; gap: .12rem; }
  .w .ar { font-family: 'Noto Naskh Arabic', 'Amiri', 'Scheherazade New', serif; font-size: 2.05rem; line-height: 1.55; white-space: nowrap; }
  .w.hl .ar { background: #ffe08a; border-radius: .3rem; box-shadow: 0 0 0 4px #ffe08a; }
  .w small { font-size: .68rem; max-width: 7.5rem; text-align: center; color: inherit; }
  body.no-tr .w small.tr, body.no-en .w small.en { display: none; }
  .num { align-self: center; font-size: 1rem; color: #8a6d1d; border: 1.5px solid #c9a94e; border-radius: 50%; min-width: 1.9rem; height: 1.9rem; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; background: #fffdf7; }
  .meal { font-size: .88rem; color: #444; margin-top: .5rem; padding: .5rem .7rem; background: #fffdf7; border-radius: .4rem; border: 1px solid #e5dcc3; display: none; }
  body.show-meal .meal { display: block; }
  .meal b { color: #8a6d1d; font-weight: 600; }
  body.black .w .ar, body.black .w small { color: var(--ink) !important; }
  .dot { width: .8rem; height: .8rem; border-radius: 50%; display: inline-block; margin-inline-end: .25rem; vertical-align: -1px; }
</style></head><body class="show-meal">
<header>
  <label>Sure <select id="surah"></select></label>
  <label>Kâri <select id="reciter"></select></label>
  <label>Mod <select id="mode"><option value="renkli">Renkli</option><option value="siyah">Siyah</option><option value="mahrec">Mahreç (deneysel)</option></select></label>
  <label><input type="checkbox" id="tr" checked> TR kelime</label>
  <label><input type="checkbox" id="en" checked> EN kelime</label>
  <label><input type="checkbox" id="meal" checked> Ayet meali</label>
  <button id="play">▶ Sureyi çal</button>
</header>
<div id="legend">
  <span><span class="dot" style="background:#e53935"></span>el-Cevf (boşluk)</span>
  <span><span class="dot" style="background:#8e24aa"></span>el-Halk (boğaz)</span>
  <span><span class="dot" style="background:#1e88e5"></span>el-Lisân (dil)</span>
  <span><span class="dot" style="background:#43a047"></span>eş-Şefetân (dudaklar)</span>
  <span style="color:#777">el-Hayşûm bağlamsaldır; bu basitleştirilmiş önizlemede gösterilmez.</span>
</div>
<main id="main"></main>
<audio id="audio"></audio>
<script>
const PALET = ['#1565c0','#c62828','#2e7d32','#6a1b9a','#ef6c00','#00838f','#ad1457','#4e342e','#33691e','#283593'];
const MAHREC = (() => {
  const g = { '#e53935': 'اٰآىٱ', '#8e24aa': 'ءهعحغخأإئؤ', '#43a047': 'فبمو' };
  const map = new Map();
  for (const [color, chars] of Object.entries(g)) for (const c of chars) map.set(c, color);
  return map;
})();
const seg = new Intl.Segmenter('ar', { granularity: 'grapheme' });
const $ = (id) => document.getElementById(id);
const state = { surah: 1, reciter: 'Husary_64kbps', data: null, playing: false, ayahIdx: 0 };

function mahrecHTML(word) {
  return [...seg.segment(word)].map(({ segment: gr }) => {
    const base = gr[0];
    const color = MAHREC.get(base) ?? (/[\\u0621-\\u064a]/.test(base) ? '#1e88e5' : 'inherit');
    return '<span style="color:' + color + '">' + gr + '</span>';
  }).join('');
}

function render() {
  const mode = $('mode').value;
  document.body.classList.toggle('black', mode === 'siyah');
  document.body.classList.toggle('mahrec', mode === 'mahrec');
  const main = $('main'); main.innerHTML = '';
  state.data.ayahs.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = 'ayah'; div.id = 'a' + a.ayah;
    const words = a.words.map((w, wi) => {
      const color = PALET[wi % PALET.length];
      const ar = mode === 'mahrec' ? mahrecHTML(w.ar) : w.ar;
      return '<span class="w" data-p="' + w.p + '" style="color:' + color + '">' +
        '<span class="ar">' + ar + '</span>' +
        '<small class="tr">' + (w.tr ?? '') + '</small>' +
        '<small class="en">' + (w.en ?? '') + '</small></span>';
    }).join('');
    div.innerHTML = '<div class="words">' + words +
      '<span class="num" title="Bu ayetten çal">' + a.ayah + '</span></div>' +
      '<div class="meal"><b>' + state.surah + ':' + a.ayah + '</b> ' + (a.meal.tr ?? '') +
      (a.meal.en ? '<br><b>EN</b> ' + a.meal.en : '') + '</div>';
    div.querySelector('.num').onclick = () => playFrom(i);
    main.appendChild(div);
  });
}

async function load() {
  state.data = await (await fetch('/api/surah/' + state.surah + '?reciter=' + state.reciter)).json();
  stop(); render();
}

const audio = $('audio');
function playFrom(i) {
  state.ayahIdx = i; state.playing = true; $('play').textContent = '⏸ Durdur';
  const a = state.data.ayahs[i];
  document.querySelectorAll('.ayah.active').forEach((e) => e.classList.remove('active'));
  const el = $('a' + a.ayah);
  el.classList.add('active');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const pad = (n, l) => String(n).padStart(l, '0');
  audio.src = '/audio/' + state.reciter + '/' + pad(state.surah, 3) + pad(a.ayah, 3) + '.mp3';
  audio.play();
}
function stop() {
  state.playing = false; audio.pause(); $('play').textContent = '▶ Sureyi çal';
  document.querySelectorAll('.ayah.active, .w.hl').forEach((e) => e.classList.remove('active', 'hl'));
}
audio.ontimeupdate = () => {
  if (!state.playing) return;
  const a = state.data.ayahs[state.ayahIdx];
  const ms = audio.currentTime * 1000;
  const s = a.segments.find((x) => ms >= x[2] && ms < x[3]);
  const el = $('a' + a.ayah);
  el.querySelectorAll('.w.hl').forEach((e) => e.classList.remove('hl'));
  if (s) el.querySelector('.w[data-p="' + (s[0] + 1) + '"]')?.classList.add('hl');
};
audio.onended = () => {
  if (state.ayahIdx + 1 < state.data.ayahs.length) playFrom(state.ayahIdx + 1);
  else stop();
};
$('play').onclick = () => state.playing ? stop() : playFrom(0);

(async () => {
  const meta = await (await fetch('/api/meta')).json();
  $('surah').innerHTML = meta.surahs.map((s) =>
    '<option value="' + s.id + '">' + s.id + '. ' + s.name_tr + ' — ' + s.name_arabic + '</option>').join('');
  $('reciter').innerHTML = meta.reciters.map((r) =>
    '<option value="' + r.slug + '">' + r.name + '</option>').join('');
  $('reciter').value = state.reciter;
  $('surah').onchange = (e) => { state.surah = Number(e.target.value); load(); };
  $('reciter').onchange = (e) => { state.reciter = e.target.value; load(); };
  $('mode').onchange = render;
  $('tr').onchange = (e) => document.body.classList.toggle('no-tr', !e.target.checked);
  $('en').onchange = (e) => document.body.classList.toggle('no-en', !e.target.checked);
  $('meal').onchange = (e) => document.body.classList.toggle('show-meal', e.target.checked);
  await load();
})();
</script></body></html>`;
