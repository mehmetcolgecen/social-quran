import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const ROOT = new URL('../../../', import.meta.url).pathname;
export const RAW = `${ROOT}data/raw/`;
export const PROCESSED = `${ROOT}data/processed/`;
export const AUDIO = `${ROOT}data/audio/`;

export const RECITERS = [
  { slug: 'Husary_64kbps', name: 'Mahmoud Khalil Al-Husary', align: 'Husary_64kbps' },
  { slug: 'Abdul_Basit_Murattal_64kbps', name: 'Abdul Basit (Murattal)', align: 'Abdul_Basit_Murattal_64kbps' },
  { slug: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy', align: 'Alafasy_128kbps' },
  { slug: 'Minshawy_Murattal_128kbps', name: 'Minshawi (Murattal)', align: 'Minshawy_Murattal_128kbps' },
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export async function fetchWithRetry(url, { tries = 5, asJson = true } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: asJson ? 'application/json' : '*/*' } });
      if (res.ok) return asJson ? res.json() : res.text();
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} ${url}`);
        await sleep(1000 * 2 ** i);
        continue;
      }
      throw new Error(`HTTP ${res.status} ${url}`);
    } catch (err) {
      lastErr = err;
      await sleep(1000 * 2 ** i);
    }
  }
  throw lastErr;
}

export async function readJSON(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function writeJSON(path, obj) {
  await writeFile(path, JSON.stringify(obj));
}

export async function sha256(path) {
  const buf = await readFile(path);
  return createHash('sha256').update(buf).digest('hex');
}

// Tanzil txt-2 satırları: "sure|ayet|metin"; '#' ile başlayan ve boş satırlar meta.
export async function parseTanzil() {
  const text = await readFile(`${RAW}tanzil/quran-uthmani.txt`, 'utf8');
  const ayahs = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [s, a, ...rest] = t.split('|');
    ayahs.push({ surah: Number(s), ayah: Number(a), text: rest.join('|') });
  }
  return ayahs;
}
