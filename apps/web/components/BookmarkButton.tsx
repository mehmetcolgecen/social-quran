'use client';
import { useEffect, useState } from 'react';
import { BOOKMARKS_KEY, loadJSON, onStoreChange, saveJSON, type Bookmark } from '@/lib/store';

export default function BookmarkButton({ surah, ayah, name }: { surah: number; ayah: number; name: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setOn(loadJSON<Bookmark[]>(BOOKMARKS_KEY, []).some((b) => b.surah === surah && b.ayah === ayah));
    check();
    return onStoreChange(BOOKMARKS_KEY, check);
  }, [surah, ayah]);

  const toggle = () => {
    const list = loadJSON<Bookmark[]>(BOOKMARKS_KEY, []);
    const next = on
      ? list.filter((b) => !(b.surah === surah && b.ayah === ayah))
      : [{ surah, ayah, name, ts: Date.now() }, ...list].slice(0, 200);
    saveJSON(BOOKMARKS_KEY, next);
  };

  return (
    <button className={`bmark${on ? ' on' : ''}`} title={on ? 'Yer imini kaldır' : 'Yer imi ekle'} onClick={toggle}>
      {/* Kırmızı kitap ayracı: ekliyken dolu, değilken kontur */}
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path d="M6.2 2.6h11.6a1 1 0 0 1 1 1v17.8l-6.8-5.2-6.8 5.2V3.6a1 1 0 0 1 1-1Z"
          fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
