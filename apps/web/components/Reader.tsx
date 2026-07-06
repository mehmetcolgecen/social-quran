'use client';
// Okuma deneyimi çekirdeği: renkli kelimeler + anlam satırları + mahreç modu + kelime takipli ses.
// Kelimeye tıklanınca popover açılır (anlam/transliterasyon + segment bazlı dinleme + yorum).
// Yorumlar ilgili ayetin altında inline kutuda açılır (Comments.tsx).
// Renkler tema-duyarlı CSS değişkenlerinden gelir (--w0..--w9, --mh-*).
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSettings } from '@/lib/settings';
import { mahrecSegments } from '@/lib/mahrec';
import type { Ayah, ReaderGroup, Reciter, Word } from '@/lib/types';
import SettingsBar from './SettingsBar';
import { AyahBadge, CommentsProvider, InlineComments, TargetButtons, useComments } from './Comments';

const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const pad3 = (n: number) => String(n).padStart(3, '0');

type Mode = 'renkli' | 'siyah' | 'mahrec';

function WordPopover({ surah, ayah, word, words, count, onListen, onClose }: {
  surah: number; ayah: number; word: Word; words: { p: number; ar: string }[];
  count: number; onListen: () => void; onClose: () => void;
}) {
  const { open } = useComments();
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.wpop')) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <span className="wpop" dir="ltr" onClick={(e) => e.stopPropagation()}>
      <span className="wpop-ar" dir="rtl">{word.ar}</span>
      {word.tl && <i className="wpop-tl">{word.tl}</i>}
      <span className="wpop-meanings">
        {word.tr && <span><b>TR</b> {word.tr}</span>}
        {word.en && <span><b>EN</b> {word.en}</span>}
      </span>
      <span className="wpop-actions">
        <button onClick={() => { onListen(); onClose(); }}>▶ Dinle</button>
        <button onClick={() => { open({ type: 'word', key: `${surah}:${ayah}:${word.p}`, words }); onClose(); }}>
          💬 Yorum{count > 0 ? ` (${count})` : ''}
        </button>
      </span>
    </span>
  );
}

function WordSpan({ word, wi, mode, active, count, onClick, popover }: {
  word: Word; wi: number; mode: Mode; active: boolean; count: number;
  onClick: () => void; popover: ReactNode;
}) {
  const color = mode === 'renkli' ? `var(--w${wi % 10})` : undefined;
  return (
    <span className={`w${active ? ' hl' : ''}`} style={color ? { color } : undefined}>
      {count > 0 && <sup className="wcount" title={`${count} kelime yorumu`}>{count}</sup>}
      <button className="ar" dir="rtl" onClick={onClick} title="Kelime seçenekleri">
        {mode === 'mahrec'
          ? mahrecSegments(word.ar).map((s, i) => (
              <span key={i} style={s.group ? { color: `var(--mh-${s.group})` } : undefined}>{s.text}</span>
            ))
          : word.ar}
      </button>
      {word.tr && <small className="wtr">{word.tr}</small>}
      {word.en && <small className="wen">{word.en}</small>}
      {popover}
    </span>
  );
}

const AyahRow = memo(function AyahRow({
  surahId, ayah, mode, activeWord, isActive, gi, ai, onPlay,
  wordCounts, openWord, onWordClick, onWordListen,
}: {
  surahId: number; ayah: Ayah; mode: Mode; activeWord: number | null;
  isActive: boolean; gi: number; ai: number; onPlay: (gi: number, ai: number) => void;
  wordCounts: Record<number, number> | undefined; openWord: number | null;
  onWordClick: (gi: number, ai: number, p: number) => void;
  onWordListen: (gi: number, ai: number, p: number) => void;
}) {
  const slimWords = useMemo(() => ayah.words.map((w) => ({ p: w.p, ar: w.ar })), [ayah.words]);
  return (
    <div id={`ayet-${surahId}-${ayah.ayah}`} className={`ayah${isActive ? ' active' : ''}`}>
      <div className="words" dir="rtl">
        {ayah.words.map((w, wi) => (
          <WordSpan
            key={w.p} word={w} wi={wi} mode={mode}
            active={isActive && activeWord === w.p}
            count={wordCounts?.[w.p] ?? 0}
            onClick={() => onWordClick(gi, ai, w.p)}
            popover={openWord === w.p ? (
              <WordPopover surah={surahId} ayah={ayah.ayah} word={w} words={slimWords}
                count={wordCounts?.[w.p] ?? 0}
                onListen={() => onWordListen(gi, ai, w.p)}
                onClose={() => onWordClick(gi, ai, w.p)} />
            ) : null}
          />
        ))}
        <button className="num" title={`${surahId}:${ayah.ayah} — bu ayetten dinle`} onClick={() => onPlay(gi, ai)}>
          {ayah.ayah}
        </button>
        <AyahBadge surah={surahId} ayah={ayah.ayah} words={slimWords} />
      </div>
      <div className="meal">
        <span className="mtr"><b>{ayah.key}</b> {ayah.meal.tr}</span>
        <span className="men"><b>{ayah.key}</b> {ayah.meal.en}</span>
      </div>
      <InlineComments anchor={`${surahId}:${ayah.ayah}`} />
    </div>
  );
});

// Provider içinde çalışan gövde: kelime yorum sayıları için context'e erişir
function ReaderBody({ groups, showPageMarkers, mode, pos, activeWord, playAt, playWord }: {
  groups: ReaderGroup[]; showPageMarkers: boolean; mode: Mode;
  pos: { g: number; a: number } | null; activeWord: number | null;
  playAt: (g: number, a: number) => void; playWord: (g: number, a: number, p: number) => void;
}) {
  const { counts } = useComments();
  const [openWord, setOpenWord] = useState<{ gi: number; ai: number; p: number } | null>(null);

  // location ("2:255:3") sayımlarını ayet bazında gruplar → AyahRow'a stabil prop
  const wordCountMap = useMemo(() => {
    const m = new Map<string, Record<number, number>>();
    for (const c of Object.values(counts)) {
      for (const [loc, n] of Object.entries(c.words)) {
        const [s, a, p] = loc.split(':');
        const key = `${s}:${a}`;
        if (!m.has(key)) m.set(key, {});
        m.get(key)![Number(p)] = n;
      }
    }
    return m;
  }, [counts]);

  const onWordClick = useCallback((gi: number, ai: number, p: number) => {
    setOpenWord((prev) => (prev && prev.gi === gi && prev.ai === ai && prev.p === p ? null : { gi, ai, p }));
  }, []);
  const onWordListen = useCallback((gi: number, ai: number, p: number) => playWord(gi, ai, p), [playWord]);

  return (
    <>
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
              const rowOpenWord = openWord && openWord.gi === gi && openWord.ai === ai ? openWord.p : null;
              return (
                <div key={ayah.ayah}>
                  {marks}
                  <AyahRow surahId={group.surah.id} ayah={ayah} mode={mode}
                    activeWord={isActive ? activeWord : null} isActive={isActive}
                    gi={gi} ai={ai} onPlay={playAt}
                    wordCounts={wordCountMap.get(`${group.surah.id}:${ayah.ayah}`)}
                    openWord={rowOpenWord} onWordClick={onWordClick} onWordListen={onWordListen} />
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

export default function Reader({ groups, reciters, showPageMarkers = true, pageNumber, mushaf = false }: {
  groups: ReaderGroup[]; reciters: Reciter[]; showPageMarkers?: boolean; pageNumber?: number; mushaf?: boolean;
}) {
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement>(null);
  const timingsRef = useRef(new Map<string, Map<number, number[][]>>());
  const pendingSeekRef = useRef<number | null>(null);
  const stopAtRef = useRef<number | null>(null);
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

  const startAudio = useCallback((g: number, a: number, seek: { from: number; to: number } | null) => {
    const surah = groups[g].surah.id;
    const ayah = groups[g].ayahs[a].ayah;
    setPos({ g, a });
    setPaused(false);
    setActiveWord(null);
    void ensureTimings(surah);
    pendingSeekRef.current = seek?.from ?? null;
    stopAtRef.current = seek?.to ?? null;
    const el = audioRef.current!;
    el.src = `/audio/${settings.reciter}/${pad3(surah)}${pad3(ayah)}.mp3`;
    el.playbackRate = speed;
    void el.play();
    if (!seek) {
      document.getElementById(`ayet-${surah}-${ayah}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    try { localStorage.setItem('sk-last', JSON.stringify({ surah, ayah, name: groups[g].surah.name_tr })); } catch { /* yoksay */ }
  }, [groups, settings.reciter, speed, ensureTimings]);

  const playAt = useCallback((g: number, a: number) => startAudio(g, a, null), [startAudio]);

  // Kelime segmenti çalma: zamanlama varsa yalnızca o aralık, yoksa ayetin tamamı
  const playWord = useCallback(async (g: number, a: number, p: number) => {
    const surah = groups[g].surah.id;
    const ayah = groups[g].ayahs[a].ayah;
    await ensureTimings(surah);
    const seg = timingsRef.current.get(`${settings.reciter}:${surah}`)?.get(ayah)?.find((s) => s[0] === p - 1);
    startAudio(g, a, seg ? { from: seg[2], to: seg[3] } : null);
  }, [groups, settings.reciter, ensureTimings, startAudio]);

  const stop = useCallback(() => {
    setPos(null);
    setPaused(false);
    setActiveWord(null);
    pendingSeekRef.current = null;
    stopAtRef.current = null;
    const el = audioRef.current;
    if (el) { el.pause(); el.removeAttribute('src'); }
  }, []);

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

  const onLoadedMetadata = () => {
    const el = audioRef.current!;
    if (pendingSeekRef.current != null) {
      el.currentTime = pendingSeekRef.current / 1000;
      pendingSeekRef.current = null;
    }
  };

  const onTimeUpdate = () => {
    if (!pos) return;
    const el = audioRef.current!;
    const ms = el.currentTime * 1000;
    if (stopAtRef.current != null && ms >= stopAtRef.current) return stop();
    const g = groups[pos.g];
    const segs = timingsRef.current.get(`${settings.reciter}:${g.surah.id}`)?.get(g.ayahs[pos.a].ayah);
    if (!segs) return;
    const seg = segs.find((s) => ms >= s[2] && ms < s[3]);
    const wordCount = g.ayahs[pos.a].words.length;
    setActiveWord(seg && seg[0] < wordCount ? seg[0] + 1 : null);
  };

  const onEnded = () => {
    if (!pos) return;
    if (stopAtRef.current != null) return stop();
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

  const body = (
    <ReaderBody groups={groups} showPageMarkers={showPageMarkers} mode={settings.mode}
      pos={pos} activeWord={activeWord} playAt={playAt} playWord={playWord} />
  );

  return (
    <div className={cls} style={{ ['--ar-scale' as string]: settings.fontScale }}>
      <CommentsProvider groups={groups} pageNumber={pageNumber} enabled={settings.comments}>
        <SettingsBar reciters={reciters} onPlaySurah={() => (pos ? stop() : playAt(0, 0))} playing={pos !== null} />
        <TargetButtons groups={groups} pageNumber={pageNumber} />
        {mushaf ? (
          <div className="mushaf-frame"><div className="mushaf-band"><div className="mushaf-inner">{body}</div></div></div>
        ) : body}
        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} onLoadedMetadata={onLoadedMetadata} />
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
