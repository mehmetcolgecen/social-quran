'use client';
// Okuyucu düğme grubu: görünüm geçişi + Ayarlar + Dinle (+ sayfa görünümünde "okudum").
// Grup, üst bardaki #header-orta yuvasına PORTALLANIR (kullanıcı isteği: bar ortası);
// yuva yoksa (SSR/ilk boya) akış içinde kalır. Mahreç lejantı metnin yanında kalır.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSettings } from '@/lib/settings';
import { useT, type UiKey } from '@/lib/i18n';
import { MAHREC_GROUPS } from '@/lib/mahrec';

export default function SettingsBar({ onPlaySurah, playing, toggleHref, toggleKey, children }: {
  onPlaySurah: () => void; playing: boolean; toggleHref: string; toggleKey: UiKey; children?: ReactNode;
}) {
  const { settings } = useSettings();
  const t = useT();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => { setSlot(document.getElementById('header-orta')); }, []);

  const row = (
    <div className="reader-head">
      <Link className="view-toggle" href={toggleHref}>{t(toggleKey)}</Link>
      <button
        className="view-toggle"
        onClick={() => window.dispatchEvent(new CustomEvent('sk-open-menu'))}
      >
        {t('settingsBtn')}
      </button>
      <button className="view-toggle play-btn" onClick={onPlaySurah}>{playing ? t('stop') : t('listen')}</button>
      {children}
    </div>
  );

  return (
    <>
      {slot ? createPortal(row, slot) : row}
      {settings.mode === 'mahrec' && (
        <div className="legend">
          {MAHREC_GROUPS.map((g) => (
            <span key={g.key}>
              <i className="dot" style={{ background: g.neutral ? 'var(--ink)' : `var(--mh-${g.key})` }} /> {g.label}
            </span>
          ))}
          <span className="note">Yalnızca tecvid takibinde kritik bölgeler renklidir; el-Hayşûm (ğunne) bağlamsal olduğundan gösterilmez.</span>
        </div>
      )}
    </>
  );
}
