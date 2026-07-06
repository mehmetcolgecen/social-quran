// Faz 0 veri indirme — idempotent: mevcut dosyalar atlanır, yarıda kesilirse tekrar çalıştırılır.
// Kaynaklar: Tanzil (Uthmani metin), quran.com API v4 (kelime TR/EN + meal + sayfa/satır),
// quran-align (kelime-seviyesi ses zamanlamaları, CC-BY 4.0).
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { RAW, ensureDir, exists, fetchWithRetry, sleep, writeJSON } from './lib.mjs';

const TANZIL_URL = 'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true';
const API = 'https://api.quran.com/api/v4';
const ALIGN_URL = 'https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip';
// quran.com API meal kaynak ID'leri: 52 = Elmalılı Hamdi Yazır (TR), 20 = Saheeh International (EN)
const TRANSLATION_ID = { tr: 52, en: 20 };
// Ek meal dilleri (tam çeviri; /quran/translations/{id} tek istekte 6236 ayet döner)
const MEAL_LANGS = {
  de: { id: 27, source: 'Frank Bubenheim & Nadeem Elyas' },
  fr: { id: 31, source: 'Muhammad Hamidullah' },
  it: { id: 153, source: 'Hamza Roberto Piccardo' },
  es: { id: 83, source: 'Sheikh Isa García' },
  ur: { id: 234, source: 'Fatah Muhammad Jalandhari' },
  hi: { id: 122, source: 'Maulana Azizul Haque al-Umari' },
  ko: { id: 219, source: 'Hamed Choi' },
  ja: { id: 218, source: 'Saeed Sato' },
  zh: { id: 56, source: 'Ma Jian' },
};
// Kelime-kelime çevirisi API'de mevcut ek diller (tr/en zaten kelime dosyalarında gömülü)
const WBW_EXTRA = ['ur', 'hi'];

async function downloadTanzil() {
  const path = `${RAW}tanzil/quran-uthmani.txt`;
  if (await exists(path)) return console.log('tanzil: mevcut, atlandı');
  await ensureDir(`${RAW}tanzil`);
  const text = await fetchWithRetry(TANZIL_URL, { asJson: false });
  const dataLines = text.split('\n').filter((l) => l.includes('|'));
  if (dataLines.length < 6236) throw new Error(`tanzil: beklenmedik satır sayısı ${dataLines.length}`);
  await writeFile(path, text);
  console.log(`tanzil: indirildi (${dataLines.length} ayet satırı)`);
}

async function downloadChapters() {
  for (const lang of ['tr', 'en']) {
    const path = `${RAW}qdc/chapters-${lang}.json`;
    if (await exists(path)) { console.log(`chapters-${lang}: mevcut, atlandı`); continue; }
    await ensureDir(`${RAW}qdc`);
    const data = await fetchWithRetry(`${API}/chapters?language=${lang}`);
    if (data.chapters.length !== 114) throw new Error(`chapters-${lang}: 114 değil`);
    await writeJSON(path, data);
    console.log(`chapters-${lang}: indirildi`);
  }
}

async function downloadWords() {
  const wordFields = 'text_uthmani,location,page_number,line_number';
  for (const lang of ['tr', 'en']) {
    await ensureDir(`${RAW}qdc/words-${lang}`);
    for (let ch = 1; ch <= 114; ch++) {
      const path = `${RAW}qdc/words-${lang}/${String(ch).padStart(3, '0')}.json`;
      if (await exists(path)) continue;
      const verses = [];
      let page = 1;
      while (page) {
        const url = `${API}/verses/by_chapter/${ch}?language=${lang}&words=true` +
          `&word_fields=${wordFields}&fields=text_uthmani&translations=${TRANSLATION_ID[lang]}` +
          `&per_page=50&page=${page}`;
        const data = await fetchWithRetry(url);
        verses.push(...data.verses);
        page = data.pagination.next_page;
        await sleep(60);
      }
      await writeJSON(path, { chapter: ch, verses });
      if (ch % 20 === 0) console.log(`words-${lang}: ${ch}/114`);
    }
    console.log(`words-${lang}: tamamlandı`);
  }
}

async function downloadMeals() {
  for (const [lang, { id, source }] of Object.entries(MEAL_LANGS)) {
    const path = `${RAW}qdc/translation-${lang}.json`;
    if (await exists(path)) { console.log(`meal-${lang}: mevcut, atlandı`); continue; }
    const data = await fetchWithRetry(`${API}/quran/translations/${id}`);
    if (data.translations.length !== 6236) throw new Error(`meal-${lang}: ${data.translations.length} != 6236`);
    await writeJSON(path, { lang, id, source, translations: data.translations });
    console.log(`meal-${lang}: indirildi (${source})`);
    await sleep(100);
  }
}

async function downloadWbwExtra() {
  for (const lang of WBW_EXTRA) {
    await ensureDir(`${RAW}qdc/words-${lang}`);
    for (let ch = 1; ch <= 114; ch++) {
      const path = `${RAW}qdc/words-${lang}/${String(ch).padStart(3, '0')}.json`;
      if (await exists(path)) continue;
      const verses = [];
      let page = 1;
      while (page) {
        const url = `${API}/verses/by_chapter/${ch}?language=${lang}&words=true&word_fields=location&per_page=50&page=${page}`;
        const data = await fetchWithRetry(url);
        verses.push(...data.verses);
        page = data.pagination.next_page;
        await sleep(60);
      }
      await writeJSON(path, { chapter: ch, verses });
      if (ch % 30 === 0) console.log(`words-${lang}: ${ch}/114`);
    }
    console.log(`words-${lang}: tamamlandı`);
  }
}

async function downloadAlign() {
  const dir = `${RAW}quran-align`;
  const zip = `${dir}/quran-align-data.zip`;
  if (!(await exists(zip))) {
    await ensureDir(dir);
    const res = await fetch(ALIGN_URL, { redirect: 'follow' });
    if (!res.ok) throw new Error(`quran-align: HTTP ${res.status}`);
    await writeFile(zip, Buffer.from(await res.arrayBuffer()));
    console.log('quran-align: zip indirildi');
  }
  execFileSync('python3', ['-m', 'zipfile', '-e', zip, dir]);
  console.log('quran-align: açıldı');
}

await downloadTanzil();
await downloadChapters();
await downloadWords();
await downloadMeals();
await downloadWbwExtra();
await downloadAlign();
console.log('İndirme tamam. Sıradaki: npm run -w packages/quran-data validate');
