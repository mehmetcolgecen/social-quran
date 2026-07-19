'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DERSLER } from '@/lib/ogren';
import { loadJSON } from '@/lib/store';
import { useT } from '@/lib/i18n';

export default function OgrenHero() {
  const t = useT();
  const [done, setDone] = useState(0);
  useEffect(() => { setDone(loadJSON<string[]>('sk-ogren-v2', []).length); }, []);
  const pct = Math.round((done / DERSLER.length) * 100);
  return (
    <Link href="/ogren" className="ogren-hero">
      <span className="ogren-hero-icon">🎓</span>
      <span className="ogren-hero-text">
        <b>{t('heroLearnTitle')}</b>
        <small>{t('heroLearnSub').replace('{n}', String(DERSLER.length))}</small>
        <span className="mem-progress"><span className="mem-bar" style={{ width: `${pct}%` }} /></span>
      </span>
      <span className="ogren-hero-cta">{done === 0 ? t('heroStart') : pct === 100 ? t('heroDone') : `%${pct} · ${t('heroContinue')}`}</span>
    </Link>
  );
}
