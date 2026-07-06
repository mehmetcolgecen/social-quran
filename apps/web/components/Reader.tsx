'use client';
// Okuma deneyimi çekirdeği: renkli kelimeler + anlam satırları + mahreç modu + kelime takipli ses.
// Ayarların çoğu CSS sınıfıyla uygulanır (yeniden render yok → anında). Mod değişimi
// (renkli/mahreç) render gerektirir; AyahRow memo'lu olduğundan yalnızca gerekli satırlar çizilir.
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/lib/settings';
import { mahrecSegments } from '@/lib/mahrec';
import type { Ayah, ReaderGroup, Reciter } from '@/lib/types';
import SettingsBar from './SettingsBar';
import { AyahBadge, CommentsProvider, TargetButtons } from './Comments';

const PALETTE = ['#1565c0', '#c62828', '#2e7d32', '#6a1b9a', '#ef6c00', '#00838f', '#ad1457', '#4e342e', '#33691e', '#283593'];
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const pad3 = (n: number) => String(n).padStart(3, '0');

type Mode = 'renkli' | 'siyah' | 'mahrec';

function WordSpan({ word, wi, mode, active }: { word: Ayah['words'][number]; wi: number; mode: Mode; active: boolean }) {
  const color = mode === 'renkli' ? PALETTE[wi % PALETTE.length] : undefined;
  return (
    <span className={`w${active ? ' hl' : ''}`} style={color ? { color } : undefined}>
      <span className="ar" dir="rtl">
        {mode === 'mahrec'
          ? mahrecSegments(word.ar).map((s, i) => (
              <span key={i} style={s.color ? { color: s.color } : undefined}>{s.text}</span>
            ))
          : word.ar}
      </span>
      {word.tr && <small className="wtr">{word.tr}</small>}
      {word.en && <small className="wen">{word.en}</small>}
    </span>
  );
}

const AyahRow = memo(function AyahRow({ surahId, ayah, mode, activeWord, isActive, gi, ai, onPlay }: {
  surahId: number; ayah: Ayah; mode: Mode; activeWord: number | null;
  isActive: boolean; gi: number; ai: number; onPlay: (gi: number, ai: number) => void;
}) {
  return (
    <div id={`ayet-${surahId}-${ayah.ayah}`} className={`ayah${isActive ? ' active' : ''}`}>
      <div className="words" dir="rtl">
        {ayah.words.map((w, wi) => (
          <WordSpan key={w.p} word={w} wi={wi} mode={mode} active={isActive && activeWord === w.p} />
        ))}
        <button className="num" title={`${surahId}:${ayah.ayah} — bu ayetten dinle`} onClick={() => onPlay(gi, ai)}>
          {ayah.ayah}
        </button>
        <AyahBadge surah={surahId} ayah={ayah.ayah} words={ayah.words.map((w) => ({ p: w.p, ar: w.ar }))} />
      </div>
      <div className="meal">
        <span className="mtr"><b>{ayah.key}</b> {ayah.meal.tr}</span>
        <span className="men"><b>{ayah.key}</b> {ayah.meal.en}</span>
      </div>
    </div>
  );
});

export default function Reader({ groups, reciters, showPageMarkers = true, pageNumber }: {
  groups: ReaderGroup[]; reciters: Reciter[]; showPageMarkers?: boolean; pageNumber?: number;
}) {
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement>(null);
  const timingsRef = useRef(new Map<string, Map<number, number[][]>>());
  const [pos, setPos] = useState<{ g: number; a: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  const ensureTimings = useCallback(async (surah: number) => {
    const key = `${settings.reciter}:${surah}`;
    if (!timingsRef.current.has(key)) {
      try {
        const res = await fetch(`/api/timings/${settings.reciter}/${surah}`);
        const rows: { ayah: number; segments: number[][] }[] = await res.json();
        timingsRef.current.set(key, new Map(rows.map((r) => [r.ayah, r.segments])));
      } catch {
        timingsRef.current.set(key, new Map());
      }
    }
  }, [settings.reciter]);

  const playAt = useCallback((g: number, a: number) => {
    const surah = groups[g].surah.id;
    const ayah = groups[g].ayahs[a].ayah;
    setPos({ g, a });
    setPaused(false);
    setActiveWord(null);
    void ensureTimings(surah);
    const el = audioRef.current!;
    el.src = `/audio/${settings.reciter}/${pad3(surah)}${pad3(ayah)}.mp3`;
    el.playbackRate = speed;
    void el.play();
    document.getElementById(`ayet-${surah}-${ayah}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    try { localStorage.setItem('sk-last', JSON.stringify({ surah, ayah, name: groups[g].surah.name_tr })); } catch { /* yoksay */ }
  }, [groups, settings.reciter, speed, ensureTimings]);

  const stop = useCallback(() => {
    setPos(null);
    setPaused(false);
    setActiveWord(null);
    const el = audioRef.current;
    if (el) { el.pause(); el.removeAttribute('src'); }
  }, []);

  // Kâri değişince çalmayı durdur (yeni kaynak + yeni zamanlama gerekir)
  useEffect(() => { stop(); }, [settings.reciter, stop]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => {
    const { surah } = groups[0] ?? {};
    if (surah) {
      try {
        const prev = JSON.parse(localStorage.getItem('sk-last') ?? '{}');
        if (prev.surah !== surah.id) localStorage.setItem('sk-last', JSON.stringify({ surah: surah.id, ayah: 1, name: surah.name_tr }));
      } catch { /* yoksay */ }
    }
  }, [groups]);

  const onTimeUpdate = () => {
    if (!pos) return;
    const el = audioRef.current!;
    const ms = el.currentTime * 1000;
    const g = groups[pos.g];
    const segs = timingsRef.current.get(`${settings.reciter}:${g.surah.id}`)?.get(g.ayahs[pos.a].ayah);
    if (!segs) return;
    const seg = segs.find((s) => ms >= s[2] && ms < s[3]);
    const wordCount = g.ayahs[pos.a].words.length;
    setActiveWord(seg && seg[0] < wordCount ? seg[0] + 1 : null);
  };

  const onEnded = () => {
    if (!pos) return;
    if (repeatRef.current) return playAt(pos.g, pos.a);
    const g = groups[pos.g];
    if (pos.a + 1 < g.ayahs.length) return playAt(pos.g, pos.a + 1);
    if (pos.g + 1 < groups.length) return playAt(pos.g + 1, 0);
    stop();
  };

  const togglePause = () => {
    const el = audioRef.current!;
    if (el.paused) { void el.play(); setPaused(false); } else { el.pause(); setPaused(true); }
  };

  const stepAyah = (dir: 1 | -1) => {
    if (!pos) return;
    let { g, a } = pos;
    a += dir;
    while (g >= 0 && g < groups.length && (a < 0 || a >= groups[g].ayahs.length)) {
      g += dir;
      if (g < 0 || g >= groups.length) return;
      a = dir === 1 ? 0 : groups[g].ayahs.length - 1;
    }
    playAt(g, a);
  };

  const cls = [
    'reader',
    settings.mode === 'siyah' ? 'black' : '',
    settings.wordTr ? '' : 'hide-wtr',
    settings.wordEn ? '' : 'hide-wen',
    `meal-${settings.meal}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} style={{ ['--ar-scale' as string]: settings.fontScale }}>
      <CommentsProvider groups={groups} pageNumber={pageNumber} enabled={settings.comments}>
      <SettingsBar reciters={reciters} onPlaySurah={() => (pos ? stop() : playAt(0, 0))} playing={pos !== null} />
      <TargetButtons groups={groups} pageNumber={pageNumber} />
      {groups.map((group, gi) => {
        let prevPage = gi === 0 ? -1 : groups[gi - 1].ayahs.at(-1)?.page ?? -1;
        let prevJuz = -1;
        return (
          <section key={group.surah.id}>
            {groups.length > 1 && (
              <h2 className="group-title">
                <Link href={`/sure/${group.surah.id}`}>{group.surah.id}. {group.surah.name_tr} Suresi</Link>
              </h2>
            )}
            {group.ayahs[0]?.ayah === 1 && group.surah.id !== 1 && group.surah.id !== 9 && (
              <p className="basmala" dir="rtl">{BASMALA}</p>
            )}
            {group.ayahs.map((ayah, ai) => {
              const marks = [];
              if (showPageMarkers && ayah.page !== prevPage && prevPage !== -1) {
                marks.push(
                  <div key={`p${ayah.page}`} className="page-mark">
                    <Link href={`/sayfa/${ayah.page}`}>Sayfa {ayah.page}</Link>
                  </div>,
                );
              }
              if (showPageMarkers && prevJuz !== -1 && ayah.juz !== prevJuz) {
                marks.push(<div key={`j${ayah.juz}`} className="juz-mark">{ayah.juz}. Cüz</div>);
              }
              prevPage = ayah.page;
              prevJuz = ayah.juz;
              const isActive = pos?.g === gi && pos?.a === ai;
              return (
                <div key={ayah.ayah}>
                  {marks}
                  <AyahRow surahId={group.surah.id} ayah={ayah} mode={settings.mode}
                    activeWord={isActive ? activeWord : null} isActive={isActive} gi={gi} ai={ai} onPlay={playAt} />
                </div>
              );
            })}
          </section>
        );
      })}
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />
      {pos && (
        <div className="player">
          <button onClick={() => stepAyah(-1)} title="Önceki ayet">⏮</button>
          <button onClick={togglePause} title={paused ? 'Devam' : 'Duraklat'}>{paused ? '▶' : '⏸'}</button>
          <button onClick={() => stepAyah(1)} title="Sonraki ayet">⏭</button>
          <span className="now">
            {groups[pos.g].surah.name_tr} {groups[pos.g].surah.id}:{groups[pos.g].ayahs[pos.a].ayah}
          </span>
          <label className="repeat"><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> Tekrar</label>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} title="Hız">
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1.25×</option>
            <option value={1.5}>1.5×</option>
          </select>
          <button onClick={stop} title="Kapat">✕</button>
        </div>
      )}
      </CommentsProvider>
    </div>
  );
}
