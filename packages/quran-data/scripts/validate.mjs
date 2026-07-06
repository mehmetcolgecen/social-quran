// Faz 0 doğrulama — değişmez kural #1: 114 sure / 6236 ayet / kelime tutarlılığı assert edilir,
// tüm ham dosyaların SHA-256'ları data/checksums.json'a yazılır.
import { readdir } from 'node:fs/promises';
import { RAW, ROOT, RECITERS, parseTanzil, readJSON, sha256, writeJSON } from './lib.mjs';

const errors = [];
const warnings = [];
const stats = {};
const assert = (cond, msg) => { if (!cond) errors.push(msg); };

// 1) Tanzil metni
const tanzil = await parseTanzil();
const tanzilBySurah = new Map();
const tanzilByKey = new Map();
for (const a of tanzil) {
  tanzilBySurah.set(a.surah, (tanzilBySurah.get(a.surah) ?? 0) + 1);
  tanzilByKey.set(`${a.surah}:${a.ayah}`, a.text);
}
assert(tanzilBySurah.size === 114, `tanzil: sure sayısı ${tanzilBySurah.size} != 114`);
assert(tanzil.length === 6236, `tanzil: ayet sayısı ${tanzil.length} != 6236`);
stats.tanzil = { surahs: tanzilBySurah.size, ayahs: tanzil.length };

// 2) Sure metadata
const chaptersTr = (await readJSON(`${RAW}qdc/chapters-tr.json`)).chapters;
const chaptersEn = (await readJSON(`${RAW}qdc/chapters-en.json`)).chapters;
assert(chaptersTr.length === 114 && chaptersEn.length === 114, 'chapters: 114 değil');
const metaCount = new Map(chaptersEn.map((c) => [c.id, c.verses_count]));
assert([...metaCount.values()].reduce((a, b) => a + b, 0) === 6236, 'chapters: toplam ayet != 6236');

// 3) Kelime verisi (TR + EN) — sayımlar, sayfa aralığı, boş çeviri, Tanzil çapraz kontrolü
let totalWords = 0, emptyTr = 0, emptyEn = 0, textMismatch = 0, verseTotal = 0;
const pages = new Set();
const wordCounts = { tr: new Map(), en: new Map() };
for (const lang of ['tr', 'en']) {
  for (let ch = 1; ch <= 114; ch++) {
    const { verses } = await readJSON(`${RAW}qdc/words-${lang}/${String(ch).padStart(3, '0')}.json`);
    assert(verses.length === metaCount.get(ch), `words-${lang} ${ch}: ayet ${verses.length} != ${metaCount.get(ch)}`);
    for (const v of verses) {
      const words = v.words.filter((w) => w.char_type_name === 'word');
      assert(words.length > 0, `words-${lang} ${v.verse_key}: 0 kelime`);
      words.forEach((w, i) => {
        assert(w.location === `${v.verse_key}:${i + 1}`, `words-${lang} ${v.verse_key}: konum sırası bozuk (${w.location})`);
        if (!w.translation?.text?.trim()) lang === 'tr' ? emptyTr++ : emptyEn++;
        if (w.page_number < 1 || w.page_number > 604) errors.push(`words-${lang} ${w.location}: sayfa ${w.page_number}`);
        pages.add(w.page_number);
      });
      wordCounts[lang].set(v.verse_key, words.length);
      assert(v.translations?.[0]?.text?.trim(), `words-${lang} ${v.verse_key}: tam meal boş`);
      if (lang === 'en') {
        verseTotal++;
        totalWords += words.length;
        if (v.text_uthmani !== tanzilByKey.get(v.verse_key)) textMismatch++;
      }
    }
  }
}
assert(verseTotal === 6236, `words: toplam ayet ${verseTotal} != 6236`);
assert(pages.size === 604, `sayfa sayısı ${pages.size} != 604`);
for (const [key, n] of wordCounts.tr) {
  if (wordCounts.en.get(key) !== n) errors.push(`kelime sayısı TR!=EN: ${key} (${n} vs ${wordCounts.en.get(key)})`);
}
if (emptyTr || emptyEn) warnings.push(`boş kelime çevirisi: TR=${emptyTr}, EN=${emptyEn}`);
if (textMismatch) warnings.push(`API text_uthmani ile Tanzil farklı olan ayet: ${textMismatch} (imlâ farkı olabilir; kanonik metin Tanzil)`);
stats.words = { total: totalWords, pages: pages.size, emptyTr, emptyEn, tanzilTextMismatch: textMismatch };

// 4) quran-align zamanlamaları (4 MVP kârisi)
stats.align = {};
for (const { align } of RECITERS.filter((r) => r.align)) {
  const data = await readJSON(`${RAW}quran-align/${align}.json`);
  const keys = new Set(data.map((e) => `${e.surah}:${e.ayah}`));
  const missing = tanzil.filter((a) => !keys.has(`${a.surah}:${a.ayah}`)).length;
  const badSeg = data.filter((e) => !Array.isArray(e.segments) || e.segments.some((s) => s.length !== 3 && s.length !== 4)).length;
  assert(badSeg === 0, `${align}: ${badSeg} ayette bozuk segment yapısı`);
  if (missing) warnings.push(`${align}: ${missing} ayette zamanlama yok`);
  stats.align[align] = { ayahs: data.length, missing };
}

// 5) SHA-256 kayıtları
const files = {};
async function hashDir(dir, prefix) {
  for (const f of (await readdir(`${RAW}${dir}`)).sort()) {
    if (f.endsWith('.json') || f.endsWith('.txt')) files[`${prefix}${f}`] = await sha256(`${RAW}${dir}/${f}`);
  }
}
files['tanzil/quran-uthmani.txt'] = await sha256(`${RAW}tanzil/quran-uthmani.txt`);
await hashDir('qdc', 'qdc/');
await hashDir('qdc/words-tr', 'qdc/words-tr/');
await hashDir('qdc/words-en', 'qdc/words-en/');
await hashDir('quran-align', 'quran-align/');
await writeJSON(`${ROOT}data/checksums.json`, { stats, files });

console.log(JSON.stringify(stats, null, 2));
warnings.forEach((w) => console.log('UYARI:', w));
if (errors.length) {
  errors.slice(0, 20).forEach((e) => console.error('HATA:', e));
  console.error(`TOPLAM ${errors.length} hata — doğrulama BAŞARISIZ`);
  process.exit(1);
}
console.log(`Doğrulama BAŞARILI: 114 sure, 6236 ayet, ${totalWords} kelime, 604 sayfa. checksums.json yazıldı (${Object.keys(files).length} dosya).`);
