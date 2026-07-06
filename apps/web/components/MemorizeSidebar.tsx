'use client';
// Sayfadaki benzersiz kelimelerin ezber listesi — tikler localStorage'da tutulur (tüm sayfalarda ortak).
// Üye profili senkronizasyonu ileride eklenebilir.
import { useEffect, useState } from 'react';

export type UniqueWord = { ar: string; tr: string | null; en: string | null; count: number };

const STORAGE_KEY = 'sk-ezber';

function motivation(done: number, total: number): string {
  if (total === 0) return '';
  if (done === 0) return '🌱 Hadi başlayalım! İlk kelimeni ezberle.';
  if (done < total / 2) return `💪 Harika gidiyorsun! ${total - done} kelime kaldı.`;
  if (done < total) return `✨ Az kaldı! Sadece ${total - done} kelime daha.`;
  return '🌟 Mâşâallah! Bu sayfadaki tüm kelimeler ezberinde.';
}

export default function MemorizeSidebar({ words }: { words: UniqueWord[] }) {
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (Array.isArray(saved)) setLearned(new Set(saved));
    } catch { /* bozuk kayıt yok sayılır */ }
    setReady(true);
  }, []);

  const toggle = (ar: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(ar)) next.delete(ar); else next.add(ar);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* dolu olabilir */ }
      return next;
    });
  };

  const done = words.filter((w) => learned.has(w.ar)).length;
  const pct = words.length ? Math.round((done / words.length) * 100) : 0;

  return (
    <aside className="memorize">
      <h3>📖 Sayfanın kelimeleri</h3>
      <p className="cmuted">{words.length} benzersiz kelime — ezberlediklerine tik at!</p>
      <div className="mem-progress" title={`%${pct}`}>
        <div className="mem-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="mem-motivation">{ready && motivation(done, words.length)}</p>
      <ul className="mem-list">
        {words.map((w) => {
          const ok = learned.has(w.ar);
          return (
            <li key={w.ar} className={ok ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={ok} onChange={() => toggle(w.ar)} />
                <span className="mem-ar" dir="rtl">{w.ar}</span>
                <span className="mem-meta">
                  {w.tr ?? w.en ?? ''}
                  {w.count > 1 && <small> ×{w.count}</small>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {ready && <p className="cmuted">Toplam ezberin: <b>{learned.size}</b> kelime</p>}
    </aside>
  );
}
