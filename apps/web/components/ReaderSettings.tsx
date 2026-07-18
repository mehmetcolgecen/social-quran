'use client';
// Okuma ayarları — hamburger çekmecesi içinde yaşar (SettingsBar'dan taşındı;
// üst çubukta yalnız görünüm geçişi + Dinle kaldı). Ayarlar global (useSettings)
// olduğundan okuyucu anında güncellenir; kâri listesi /api/reciters'tan tembel yüklenir.
import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/settings';
import { useT, type UiKey } from '@/lib/i18n';
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

const FRAMES: readonly (readonly [string, UiKey])[] = [
  ['klasik', 'frameKlasik'],
  ['zumrut', 'frameZumrut'],
  ['gul', 'frameGul'],
  ['gece', 'frameGece'],
  ['firuze', 'frameFiruze'],
  ['sade', 'frameSade'],
];

// Yalnız mushaf imlasını doğru basan fontlar (hançer elif, vasıl hemzesi vb.)
const AR_FONTS = [
  ['hafs', 'Hafs (Medine)'],
  ['amiri', 'Amiri Kur’an'],
  ['amiri-renkli', 'Amiri (renkli hareke)'],
  ['dkhatt', 'Dijital Hat (Medine)'],
] as const;

function toggleIn(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((x) => x !== code) : [...list, code];
}

const langSummary = (selected: string[], off: string) =>
  selected.length === 0 ? off : selected.map(flagOf).join(' ');

const closeDetails = (el: HTMLElement) =>
  (el.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');

let reciterCache: Reciter[] | null = null; // çekmece her açılışta yeniden istemesin

export default function ReaderSettings({ frameSelect = false }: { frameSelect?: boolean }) {
  const { settings, update } = useSettings();
  const t = useT();
  const [reciters, setReciters] = useState<Reciter[] | null>(reciterCache);

  useEffect(() => {
    if (reciterCache) return;
    void fetch('/api/reciters')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Reciter[]) => { reciterCache = list; setReciters(list); })
      .catch(() => setReciters([]));
  }, []);

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

  const current = reciters?.find((r) => r.slug === settings.reciter);

  return (
    <div className="hmenu-settings">
      <label className="hset">
        <span className="hset-label">{t('mode')}</span>
        <select value={settings.mode} onChange={(e) => update({ mode: e.target.value as typeof settings.mode })}>
          <option value="renkli">{t('modeColor')}</option>
          <option value="siyah">{t('modeBlack')}</option>
          <option value="mahrec">{t('modeMahrec')}</option>
        </select>
      </label>
      <details className="dd">
        <summary><span>{t('word')}</span><b className="hset-val">{langSummary(settings.wordLangs, t('off'))}</b></summary>
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
        <summary><span>{t('meal')}</span><b className="hset-val">{langSummary(settings.meals, t('off'))}</b></summary>
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
      <label className="hset">
        <span className="hset-label">{t('size')}</span>
        <select value={settings.fontScale} onChange={(e) => update({ fontScale: Number(e.target.value) })}>
          <option value={0.85}>{t('sizeS')}</option>
          <option value={1}>{t('sizeM')}</option>
          <option value={1.2}>{t('sizeL')}</option>
          <option value={1.4}>{t('sizeXL')}</option>
        </select>
      </label>
      <label className="hset">
        <span className="hset-label">{t('imla')}</span>
        <select value={settings.imla} onChange={(e) => update({ imla: e.target.value as typeof settings.imla })}>
          <option value="turkiye">{t('imlaTurkiye')}</option>
          <option value="medine">{t('imlaMedine')}</option>
        </select>
      </label>
      <label className="hset">
        <span className="hset-label">{t('font')}</span>
        <select value={settings.arFont} onChange={(e) => update({ arFont: e.target.value as typeof settings.arFont })}>
          {AR_FONTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {frameSelect && (
        <label className="hset">
          <span className="hset-label">{t('frame')}</span>
          <select value={settings.frame} onChange={(e) => update({ frame: e.target.value as typeof settings.frame })}>
            {FRAMES.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select>
        </label>
      )}
      <details className="dd rdd">
        <summary>
          <Medal slug={settings.reciter} small />
          <b>{current?.name ?? t('reciter')}</b>
        </summary>
        <div className="dd-panel rlist">
          {!reciters && <span className="cmuted">{t('loading')}</span>}
          {reciters?.map((r) => {
            const m = RECITER_META[r.slug];
            return (
              <button key={r.slug} className={r.slug === settings.reciter ? 'on' : ''}
                onClick={(e) => { update({ reciter: r.slug }); closeDetails(e.currentTarget); }}>
                <Medal slug={r.slug} />
                <span className="rinfo">
                  <b>{r.name}</b>
                  <small>{m ? `${m.tagIcon} ${m.tag} · ${m.desc}` : ''}{m?.wordTiming ? ` · 🎯 ${t('wordTiming')}` : ''}</small>
                </span>
              </button>
            );
          })}
        </div>
      </details>
      <label><input type="checkbox" checked={settings.comments} onChange={(e) => update({ comments: e.target.checked })} /> {t('comments')}</label>
      <label><input type="checkbox" checked={settings.notes} onChange={(e) => update({ notes: e.target.checked })} /> {t('notes')}</label>
      <label><input type="checkbox" checked={settings.science} onChange={(e) => update({ science: e.target.checked })} /> {t('science')}</label>
    </div>
  );
}
