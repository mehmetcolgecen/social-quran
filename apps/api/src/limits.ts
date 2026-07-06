// Yorum hedefi doğrulama limitleri — Kur'an verisi değişmez olduğundan statik dosyadan yüklenir
// (packages/quran-data build-db üretir). DB bağımlılığı yoktur; dev ve prod'da aynı çalışır.
import { readFileSync } from 'node:fs';
import { config } from './config';

type Limits = { pages: number; surahs: Record<string, number>; ayahWords: Record<string, number> };

export const limits: Limits = JSON.parse(readFileSync(config.limitsPath, 'utf8'));

export type TargetType = 'word' | 'ayah' | 'page' | 'surah';

// Hedef anahtarını doğrular; geçerliyse normalize edilmiş anahtarı, değilse null döner.
export function validateTarget(type: TargetType, key: string): string | null {
  if (type === 'surah') {
    const s = Number(key);
    return Number.isInteger(s) && limits.surahs[s] ? String(s) : null;
  }
  if (type === 'page') {
    const p = Number(key);
    return Number.isInteger(p) && p >= 1 && p <= limits.pages ? String(p) : null;
  }
  if (type === 'ayah') {
    const m = /^(\d{1,3}):(\d{1,3})$/.exec(key);
    if (!m) return null;
    const [s, a] = [Number(m[1]), Number(m[2])];
    return a >= 1 && a <= (limits.surahs[s] ?? 0) ? `${s}:${a}` : null;
  }
  if (type === 'word') {
    const m = /^(\d{1,3}):(\d{1,3}):(\d{1,3})$/.exec(key);
    if (!m) return null;
    const [s, a, w] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return w >= 1 && w <= (limits.ayahWords[`${s}:${a}`] ?? 0) ? `${s}:${a}:${w}` : null;
  }
  return null;
}
