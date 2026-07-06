// localStorage yardımcıları — yer imi/plan/ezber gibi cihaz-yerel veriler için.
// Değişiklikte aynı sekmedeki dinleyicilere özel event yayınlanır.
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(`sk:${key}`));
  } catch { /* dolu olabilir */ }
}

export function onStoreChange(key: string, cb: () => void): () => void {
  const h = () => cb();
  window.addEventListener(`sk:${key}`, h);
  return () => window.removeEventListener(`sk:${key}`, h);
}

export type Bookmark = { surah: number; ayah: number; name: string; ts: number };
export const BOOKMARKS_KEY = 'sk-bookmarks';

export type ReadingPlan = { goal: number; read: Record<string, string> }; // sayfa → 'YYYY-MM-DD'
export const PLAN_KEY = 'sk-plan';
export const todayStr = () => new Date().toISOString().slice(0, 10);
