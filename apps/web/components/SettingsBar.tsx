'use client';
import { useEffect } from 'react';
import { useSettings } from '@/lib/settings';
import { MAHREC_GROUPS } from '@/lib/mahrec';
import { LANGS, WBW_LANGS, flagOf } from '@/lib/langs';
import { RECITER_META } from '@/lib/reciters';
import photos from '@/lib/reciter-photos.json';
import type { Reciter } from '@/lib/types';

const PHOTOS = photos as Record<string, { license: string } | undefined>;

// Serbest lisanslı fotoğraf varsa onu, yoksa hat monogram madalyonunu gösterir
function Medal({ slug, small = false }: { slug: string; small?: boolean }) {
  const m = RECITER_META[slug];
  if (PHOTOS[slug]) {
    return <img className={`rmedal photo${small ? ' sm' : ''}`} src={`/reciters/${slug}.jpg`} alt="" loading="lazy" />;
  }
  return (
    <span className={`rmedal${small ? ' sm' : ''}`} style={{ ['--h' as string]: m?.hue ?? 40 }}>
      {m?.short ?? '؟'}
    </span>
  );
}

const FRAMES = [
  ['klasik', 'Klasik (lacivert)'],
  ['zumrut', 'Zümrüt'],
  ['gul', 'Gül kurusu'],
  ['gece', 'Gece'],
  ['firuze', 'Firuze'],
  ['sade', 'Sade altın'],
] as const;

const AR_FONTS = [
  ['hafs', 'KFGQPC Hafs'],
  ['husrev', 'Hüsrev Hattı'],
  ['amiri', 'Amiri Quran'],
  ['sheherazade', 'Scheherazade'],
  ['lateef', 'Lateef'],
  ['ruqaa', 'Aref Ruqaa'],
  ['noto', 'Noto Naskh'],
] as const;

function toggleIn(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((x) => x !== code) : [...list, code];
}

const langSummary = (selected: string[]) =>
  selected.length === 0 ? 'Kapalı' : selected.map(flagOf).join(' ');

const closeDetails = (el: HTMLElement) =>
  (el.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');

export default function SettingsBar({ reciters, onPlaySurah, playing, frameSelect = false }: {
  reciters: Reciter[]; onPlaySurah: () => void; playing: boolean; frameSelect?: boolean;
}) {
  const { settings, update } = useSettings();

  // Açık kalan dropdown'lar dışarı tıklanınca kapanır
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.querySelectorAll('details.dd[open]').forEach((d) => {
        if (!d.contains(e.target as Node)) d.removeAttribute('open');
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = reciters.find((r) => r.slug === settings.reciter);

  return (
    <>
      <div className="settings-bar">
        <label>Mod
          <select value={settings.mode} onChange={(e) => update({ mode: e.target.value as typeof settings.mode })}>
            <option value="renkli">Renkli</option>
            <option value="siyah">Siyah</option>
            <option value="mahrec">Mahreç</option>
          </select>
        </label>
        <details className="dd">
          <summary>Kelime: <b>{langSummary(settings.wordLangs)}</b></summary>
          <div className="dd-panel">
            {WBW_LANGS.map((l) => (
              <label key={l.code}>
                <input type="checkbox" checked={settings.wordLangs.includes(l.code)}
                  onChange={() => update({ wordLangs: toggleIn(settings.wordLangs, l.code) })} />
                {l.flag} {l.label}
              </label>
            ))}
          </div>
        </details>
        <details className="dd">
          <summary>Meal: <b>{langSummary(settings.meals)}</b></summary>
          <div className="dd-panel">
            {LANGS.map((l) => (
              <label key={l.code}>
                <input type="checkbox" checked={settings.meals.includes(l.code)}
                  onChange={() => update({ meals: toggleIn(settings.meals, l.code) })} />
                {l.flag} {l.label}
              </label>
            ))}
          </div>
        </details>
        <label>Boyut
          <select value={settings.fontScale} onChange={(e) => update({ fontScale: Number(e.target.value) })}>
            <option value={0.85}>Küçük</option>
            <option value={1}>Normal</option>
            <option value={1.2}>Büyük</option>
            <option value={1.4}>Çok büyük</option>
          </select>
        </label>
        <label>Yazı
          <select value={settings.arFont} onChange={(e) => update({ arFont: e.target.value as typeof settings.arFont })}>
            {AR_FONTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {frameSelect && (
          <label>Desen
            <select value={settings.frame} onChange={(e) => update({ frame: e.target.value as typeof settings.frame })}>
              {FRAMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
        <details className="dd rdd">
          <summary>
            <Medal slug={settings.reciter} small />
            <b>{current?.name ?? 'Kâri'}</b>
          </summary>
          <div className="dd-panel rlist">
            {reciters.map((r) => {
              const m = RECITER_META[r.slug];
              return (
                <button key={r.slug} className={r.slug === settings.reciter ? 'on' : ''}
                  onClick={(e) => { update({ reciter: r.slug }); closeDetails(e.currentTarget); }}>
                  <Medal slug={r.slug} />
                  <span className="rinfo">
                    <b>{r.name}</b>
                    <small>{m ? `${m.tagIcon} ${m.tag} · ${m.desc}` : ''}{m?.wordTiming ? ' · 🎯 kelime takibi' : ''}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </details>
        <label><input type="checkbox" checked={settings.comments} onChange={(e) => update({ comments: e.target.checked })} /> Yorumlar</label>
        <label><input type="checkbox" checked={settings.notes} onChange={(e) => update({ notes: e.target.checked })} /> 📝 Notlar</label>
        <label><input type="checkbox" checked={settings.science} onChange={(e) => update({ science: e.target.checked })} /> 🔬 İlim</label>
        <button className="play-btn" onClick={onPlaySurah}>{playing ? '⏹ Durdur' : '▶ Dinle'}</button>
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
