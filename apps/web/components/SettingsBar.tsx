'use client';
import { useSettings } from '@/lib/settings';
import { MAHREC_GROUPS } from '@/lib/mahrec';
import { LANGS, WBW_LANGS, flagOf } from '@/lib/langs';
import type { Reciter } from '@/lib/types';

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

export default function SettingsBar({ reciters, onPlaySurah, playing, frameSelect = false }: {
  reciters: Reciter[]; onPlaySurah: () => void; playing: boolean; frameSelect?: boolean;
}) {
  const { settings, update } = useSettings();
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
        <label>Kâri
          <select value={settings.reciter} onChange={(e) => update({ reciter: e.target.value })}>
            {reciters.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </select>
        </label>
        <label><input type="checkbox" checked={settings.comments} onChange={(e) => update({ comments: e.target.checked })} /> Yorumlar</label>
        <label><input type="checkbox" checked={settings.notes} onChange={(e) => update({ notes: e.target.checked })} /> 📝 Notlarım</label>
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
