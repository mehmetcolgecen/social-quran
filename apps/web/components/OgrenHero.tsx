'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DERSLER } from '@/lib/ogren';
import { loadJSON } from '@/lib/store';

export default function OgrenHero() {
  const [done, setDone] = useState(0);
  useEffect(() => { setDone(loadJSON<string[]>('sk-ogren', []).length); }, []);
  const pct = Math.round((done / DERSLER.length) * 100);
  return (
    <Link href="/ogren" className="ogren-hero">
      <span className="ogren-hero-icon">🎓</span>
      <span className="ogren-hero-text">
        <b>Kur&rsquo;an okumayı öğren</b>
        <small>Elifbadan tecvide 10 adım — bol örnekli, sesli pratikli</small>
        <span className="mem-progress"><span className="mem-bar" style={{ width: `${pct}%` }} /></span>
      </span>
      <span className="ogren-hero-cta">{done === 0 ? 'Başla →' : pct === 100 ? 'Tamamlandı 🌟' : `%${pct} · Devam →`}</span>
    </Link>
  );
}
