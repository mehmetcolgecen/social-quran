'use client';
// Sayfadaki benzersiz kelimelerin ezber listesi — tikler localStorage'da tutulur (tüm sayfalarda ortak).
// Üye profili senkronizasyonu ileride eklenebilir.
import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/settings';
import { useT } from '@/lib/i18n';

// `ar` kanonik Uthmani (ilerleme anahtarı), `ari` imlâî görüntü metni
export type UniqueWord = { ar: string; ari?: string | null; tr: string | null; en: string | null; count: number };

const STORAGE_KEY = 'sk-ezber';

export default function MemorizeSidebar({ words, titleKey = 'memorizeTitlePage' }: {
  words: UniqueWord[]; titleKey?: 'memorizeTitlePage' | 'memorizeTitleSurah';
}) {
  const t = useT();
  const { settings } = useSettings();
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const motivation = (done: number, total: number): string => {
    if (total === 0) return '';
    if (done === 0) return t('mot0');
    if (done < total / 2) return `${t('motHalf')} ${total - done} ${t('motLeft')}`;
    if (done < total) return `${t('motNear')} ${total - done} ${t('motLeft')}`;
    return t('motDone');
  };

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
      <h3>📖 {t(titleKey)}</h3>
      <p className="cmuted">{words.length} {t('memorizeHint')}</p>
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
                <span className="mem-ar" dir="rtl">{settings.imla === 'medine' ? w.ar : w.ari ?? w.ar}</span>
                <span className="mem-meta">
                  {w.tr ?? w.en ?? ''}
                  {w.count > 1 && <small> ×{w.count}</small>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {ready && <p className="cmuted">{t('memorizeTotal')}: <b>{learned.size}</b> {t('wordsUnit')}</p>}
    </aside>
  );
}
