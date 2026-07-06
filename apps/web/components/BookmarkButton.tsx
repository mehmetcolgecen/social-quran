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
      {on ? '🔖' : '📑'}
    </button>
  );
}
