'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BOOKMARKS_KEY, loadJSON, onStoreChange, saveJSON, type Bookmark } from '@/lib/store';

export default function YerImleriPage() {
  const [list, setList] = useState<Bookmark[] | null>(null);
  useEffect(() => {
    const load = () => setList(loadJSON<Bookmark[]>(BOOKMARKS_KEY, []));
    load();
    return onStoreChange(BOOKMARKS_KEY, load);
  }, []);

  const remove = (b: Bookmark) => {
    saveJSON(BOOKMARKS_KEY, (list ?? []).filter((x) => !(x.surah === b.surah && x.ayah === b.ayah)));
  };

  if (list === null) return <main><p className="cmuted">Yükleniyor…</p></main>;
  return (
    <main>
      <h1>🔖 Yer imlerim</h1>
      {list.length === 0 && (
        <p className="cmuted">Henüz yer imi yok. Okurken ayetin yanındaki 📑 simgesine tıklayın.</p>
      )}
      <ul className="profile-comments">
        {list.map((b) => (
          <li key={`${b.surah}:${b.ayah}`}>
            <Link href={`/sure/${b.surah}#ayet-${b.surah}-${b.ayah}`}>
              {b.name} Suresi {b.surah}:{b.ayah}
            </Link>
            <small className="cmuted" style={{ display: 'block' }}>{new Date(b.ts).toLocaleString('tr-TR')}</small>
            <button className="view-toggle" style={{ cursor: 'pointer', marginTop: '.3rem' }} onClick={() => remove(b)}>Kaldır</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
