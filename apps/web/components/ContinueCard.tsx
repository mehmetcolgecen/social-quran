'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ContinueCard() {
  const [last, setLast] = useState<{ surah: number; ayah: number; name: string; page?: number } | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sk-last');
      if (saved) setLast(JSON.parse(saved));
    } catch { /* yoksay */ }
  }, []);
  if (!last) return null;
  // Varsayılan okuma görünümü sayfa görünümüdür; eski kayıtlarda page yoksa sure görünümüne düş
  const href = last.page
    ? `/sayfa/${last.page}#ayet-${last.surah}-${last.ayah}`
    : `/sure/${last.surah}#ayet-${last.surah}-${last.ayah}`;
  return (
    <Link className="continue-card" href={href}>
      📖 Kaldığın yerden devam et: {last.name} {last.surah}:{last.ayah}
    </Link>
  );
}
