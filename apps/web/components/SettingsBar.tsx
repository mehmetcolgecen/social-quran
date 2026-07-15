'use client';
// İnce üst çubuk: görünüm geçişi + Dinle. Okuma ayarlarının tamamı hamburger
// çekmecesine taşındı (ReaderSettings.tsx); mahreç lejantı metnin yanında kalır.
import Link from 'next/link';
import { useSettings } from '@/lib/settings';
import { useT, type UiKey } from '@/lib/i18n';
import { MAHREC_GROUPS } from '@/lib/mahrec';

export default function SettingsBar({ onPlaySurah, playing, toggleHref, toggleKey }: {
  onPlaySurah: () => void; playing: boolean; toggleHref: string; toggleKey: UiKey;
}) {
  const { settings } = useSettings();
  const t = useT();

  return (
    <>
      <div className="settings-bar slim">
        <Link className="view-toggle" href={toggleHref}>{t(toggleKey)}</Link>
        <button className="play-btn" onClick={onPlaySurah}>{playing ? t('stop') : t('listen')}</button>
      </div>
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
