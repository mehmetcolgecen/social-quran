'use client';
import { useSettings } from '@/lib/settings';
import { MAHREC_GROUPS } from '@/lib/mahrec';
import type { Reciter } from '@/lib/types';

const FRAMES = [
  ['klasik', 'Klasik (lacivert)'],
  ['zumrut', 'Zümrüt'],
  ['gul', 'Gül kurusu'],
  ['gece', 'Gece'],
  ['firuze', 'Firuze'],
  ['sade', 'Sade altın'],
] as const;

export default function SettingsBar({ reciters, onPlaySurah, playing, frameSelect = false }: {
  reciters: Reciter[]; onPlaySurah: () => void; playing: boolean; frameSelect?: boolean;
}) {
  const { settings, update } = useSettings();
  const wordLangLabel = settings.wordTr && settings.wordEn ? 'TR+EN'
    : settings.wordTr ? 'TR' : settings.wordEn ? 'EN' : 'Kapalı';
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
          <summary>Kelime anlamı: <b>{wordLangLabel}</b></summary>
          <div className="dd-panel">
            <label><input type="checkbox" checked={settings.wordTr} onChange={(e) => update({ wordTr: e.target.checked })} /> Türkçe</label>
            <label><input type="checkbox" checked={settings.wordEn} onChange={(e) => update({ wordEn: e.target.checked })} /> English</label>
          </div>
        </details>
        <label>Meal
          <select value={settings.meal} onChange={(e) => update({ meal: e.target.value as typeof settings.meal })}>
            <option value="kapali">Kapalı</option>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
            <option value="iki">TR + EN</option>
          </select>
        </label>
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
            <option value="hafs">KFGQPC Hafs</option>
            <option value="amiri">Amiri Quran</option>
            <option value="sheherazade">Scheherazade</option>
            <option value="noto">Noto Naskh</option>
          </select>
        </label>
        {frameSelect && (
          <label>Desen
            <select value={settings.frame} onChange={(e) => update({ frame: e.target.value as typeof settings.frame })}>
              {FRAMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
        <label>Kâri
          <select value={settings.reciter} onChange={(e) => update({ reciter: e.target.value })}>
            {reciters.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </select>
        </label>
        <label><input type="checkbox" checked={settings.comments} onChange={(e) => update({ comments: e.target.checked })} /> Yorumlar</label>
        <button className="play-btn" onClick={onPlaySurah}>{playing ? '⏹ Durdur' : '▶ Dinle'}</button>
      </div>
      {settings.mode === 'mahrec' && (
        <div className="legend">
          {MAHREC_GROUPS.map((g) => (
            <span key={g.key}><i className="dot" style={{ background: `var(--mh-${g.key})` }} /> {g.label}</span>
          ))}
          <span className="note">Basitleştirilmiş gösterim; el-Hayşûm (ğunne) bağlamsal olduğundan renklendirilmez.</span>
        </div>
      )}
    </>
  );
}
