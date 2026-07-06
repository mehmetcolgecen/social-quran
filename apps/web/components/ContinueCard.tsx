'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ContinueCard() {
  const [last, setLast] = useState<{ surah: number; ayah: number; name: string } | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sk-last');
      if (saved) setLast(JSON.parse(saved));
    } catch { /* yoksay */ }
  }, []);
  if (!last) return null;
  return (
    <Link className="continue-card" href={`/sure/${last.surah}#ayet-${last.surah}-${last.ayah}`}>
      📖 Kaldığın yerden devam et: {last.name} {last.surah}:{last.ayah}
    </Link>
  );
}
