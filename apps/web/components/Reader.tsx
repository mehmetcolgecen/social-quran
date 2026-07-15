'use client';
// Okuma deneyimi çekirdeği: renkli kelimeler + çok dilli anlam satırları + mahreç modu +
// kelime takipli ses + hâşiye (el yazısı kendi notların) görünümü.
// tr/en kelime/meal verisi sayfa yüküne gömülü; ur/hi kelime ile diğer mealler tembel yüklenir.
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSettings } from '@/lib/settings';
import { useT } from '@/lib/i18n';
import { mahrecSegments } from '@/lib/mahrec';
import { EMBEDDED_MEAL, EMBEDDED_WBW, flagOf } from '@/lib/langs';
import type { Ayah, ReaderGroup, Word } from '@/lib/types';
import SettingsBar from './SettingsBar';
import SurahBanner from './SurahBanner';
import BookmarkButton from './BookmarkButton';
import MiracleNote from './MiracleNote';
import ShareAyah from './ShareAyah';
import { AyahBadge, CommentsProvider, InlineComments, MyNotes, NoteRail, TargetButtons, useComments } from './Comments';

const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const pad3 = (n: number) => String(n).padStart(3, '0');

type Mode = 'renkli' | 'siyah' | 'mahrec';
type LangMap = Record<string, Record<string, string>>; // lang → (location|verse_key) → metin

function wordText(word: Word, loc: string, lang: string, extra: LangMap): string | null {
  if (lang === 'tr') return word.tr;
  if (lang === 'en') return word.en;
  return extra[lang]?.[loc] ?? null;
}

function WordPopover({ surah, ayah, word, words, count, wbwExtra, onListen, onClose }: {
  surah: number; ayah: number; word: Word; words: { p: number; ar: string }[];
  count: number; wbwExtra: LangMap; onListen: () => void; onClose: () => void;
}) {
  const { open } = useComments();
  const { settings } = useSettings();
  const t = useT();
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.wpop')) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  const loc = `${surah}:${ayah}:${word.p}`;
  return (
    <span className="wpop" dir="ltr" onClick={(e) => e.stopPropagation()}>
      <span className="wpop-ar" dir="rtl">{word.ar}</span>
      {word.tl && <i className="wpop-tl">{word.tl}</i>}
      <span className="wpop-meanings">
        {settings.wordLangs.map((lang) => {
          const text = wordText(word, loc, lang, wbwExtra);
          return text ? <span key={lang}><b>{flagOf(lang)}</b> {text}</span> : null;
        })}
        {settings.wordLangs.length === 0 && <span className="cmuted">Kelime anlamı kapalı (ayarlardan açın)</span>}
      </span>
      <span className="wpop-actions">
        <button onClick={() => { onListen(); onClose(); }}>{t('listenWord')}</button>
        <button onClick={() => { open({ type: 'word', key: loc, words }); onClose(); }}>
          {t('comment')}{count > 0 ? ` (${count})` : ''}
        </button>
      </span>
    </span>
  );
}

function WordSpan({ word, loc, wi, mode, active, count, wordLangs, wbwExtra, onClick, popover }: {
  word: Word; loc: string; wi: number; mode: Mode; active: boolean; count: number;
  wordLangs: string[]; wbwExtra: LangMap; onClick: () => void; popover: ReactNode;
}) {
  const color = mode === 'renkli' ? `var(--w${wi % 10})` : undefined;
  return (
    <span className={`w${active ? ' hl' : ''}${popover ? ' wopen' : ''}`} style={color ? { color } : undefined}>
      {count > 0 && <sup className="wcount" title={`${count} kelime yorumu`}>{count}</sup>}
      <button className="ar" dir="rtl" onClick={onClick} title="Kelime seçenekleri">
        {mode === 'mahrec'
          ? mahrecSegments(word.ar).map((s, i) => (
              <span key={i} style={s.group ? { color: `var(--mh-${s.group})` } : undefined}>{s.text}</span>
            ))
          : word.ar}
      </button>
      {wordLangs.map((lang) => {
        const text = wordText(word, loc, lang, wbwExtra);
        return text ? <small key={lang} className="wln">{text}</small> : null;
      })}
      {popover}
    </span>
  );
}

const AyahRow = memo(function AyahRow({
  surahId, surahName, ayah, mode, activeWord, isActive, gi, ai, onPlay, onStop,
  wordCounts, openWord, onWordClick, onWordListen,
  wordLangs, meals, wbwExtra, mealExtra,
}: {
  surahId: number; surahName: string; ayah: Ayah; mode: Mode; activeWord: number | null;
  isActive: boolean; gi: number; ai: number; onPlay: (gi: number, ai: number) => void; onStop: () => void;
  wordCounts: Record<number, number> | undefined; openWord: number | null;
  onWordClick: (gi: number, ai: number, p: number) => void;
  onWordListen: (gi: number, ai: number, p: number) => void;
  wordLangs: string[]; meals: string[]; wbwExtra: LangMap; mealExtra: LangMap;
}) {
  const slimWords = useMemo(() => ayah.words.map((w) => ({ p: w.p, ar: w.ar })), [ayah.words]);
  return (
    <div id={`ayet-${surahId}-${ayah.ayah}`} className={`ayah${isActive ? ' active' : ''}${openWord != null ? ' pop-open' : ''}`}>
      {/* Ağır içerik .ayah-inner'da: content-visibility oraya uygulanır, böylece
          dışarı taşan hâşiye kutuları ve kenar rayı paint containment'a KIRPILMAZ. */}
      <div className="ayah-inner">
      <div className="words" dir="rtl">
        {ayah.words.map((w, wi) => (
          <WordSpan
            key={w.p} word={w} loc={`${surahId}:${ayah.ayah}:${w.p}`} wi={wi} mode={mode}
            active={isActive && activeWord === w.p}
            count={wordCounts?.[w.p] ?? 0}
            wordLangs={wordLangs} wbwExtra={wbwExtra}
            onClick={() => onWordClick(gi, ai, w.p)}
            popover={openWord === w.p ? (
              <WordPopover surah={surahId} ayah={ayah.ayah} word={w} words={slimWords}
                count={wordCounts?.[w.p] ?? 0} wbwExtra={wbwExtra}
                onListen={() => onWordListen(gi, ai, w.p)}
                onClose={() => onWordClick(gi, ai, w.p)} />
            ) : null}
          />
        ))}
        <button
          className="num"
          title={isActive ? '⏹ Durdur' : `${surahId}:${ayah.ayah} — bu ayetten dinle`}
          onClick={() => (isActive ? onStop() : onPlay(gi, ai))}
        >
          {isActive ? (
            /* Çalarken siyah kare: durdur */
            <svg viewBox="0 0 30 30" width="32" height="32" aria-hidden="true">
              <rect className="num-stop" x="7.5" y="7.5" width="15" height="15" rx="3" />
            </svg>
          ) : (
            /* Ayet numarası play üçgeninin İÇİNDE yazar */
            <svg viewBox="0 0 30 30" width="32" height="32" aria-hidden="true">
              <path d="M6.5 5.8 Q6.5 3.6 8.4 4.7 L26 14 Q27.8 15 26 16 L8.4 25.3 Q6.5 26.4 6.5 24.2 Z" />
              <text x="13.4" y="15.1" textAnchor="middle" dominantBaseline="central"
                fontSize={ayah.ayah >= 100 ? 6.5 : ayah.ayah >= 10 ? 8 : 9.5} fontWeight="700">
                {ayah.ayah}
              </text>
            </svg>
          )}
        </button>
        <AyahBadge surah={surahId} ayah={ayah.ayah} words={slimWords} />
        <BookmarkButton surah={surahId} ayah={ayah.ayah} name={surahName} />
        <ShareAyah verseKey={ayah.key} surahName={surahName} words={slimWords} mealTr={ayah.meal.tr} />
      </div>
      {meals.length > 0 && (
        <div className="meal">
          {meals.map((lang) => {
            const text = lang === 'tr' ? ayah.meal.tr : lang === 'en' ? ayah.meal.en : mealExtra[lang]?.[ayah.key];
            return (
              <span key={lang} className="mline">
                <b>{flagOf(lang)} {ayah.key}</b> {text ?? '…'}
              </span>
            );
          })}
        </div>
      )}
      <InlineComments anchor={`${surahId}:${ayah.ayah}`} />
      </div>
      <NoteRail anchor={`${surahId}:${ayah.ayah}`} />
      <MiracleNote verseKey={ayah.key} />
      <MyNotes anchor={`${surahId}:${ayah.ayah}`} words={slimWords} />
    </div>
  );
});

// Provider içinde çalışan gövde: kelime yorum sayıları için context'e erişir
function ReaderBody({ groups, showPageMarkers, mode, pos, activeWord, playAt, stopPlay, playWord, wordLangs, meals, wbwExtra, mealExtra }: {
  groups: ReaderGroup[]; showPageMarkers: boolean; mode: Mode;
  pos: { g: number; a: number } | null; activeWord: number | null;
  playAt: (g: number, a: number) => void; stopPlay: () => void;
  playWord: (g: number, a: number, p: number) => void;
  wordLangs: string[]; meals: string[]; wbwExtra: LangMap; mealExtra: LangMap;
}) {
  const { counts } = useComments();
  const [openWord, setOpenWord] = useState<{ gi: number; ai: number; p: number } | null>(null);

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
            {(groups.length > 1 || group.ayahs[0]?.ayah === 1) && (
              <Link href={`/sure/${group.surah.id}`} className="sure-banner-link" title={`${group.surah.id}. ${group.surah.name_tr}`}>
                <SurahBanner surah={group.surah} compact />
              </Link>
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
                  <AyahRow surahId={group.surah.id} surahName={group.surah.name_tr} ayah={ayah} mode={mode}
                    activeWord={isActive ? activeWord : null} isActive={isActive}
                    gi={gi} ai={ai} onPlay={playAt} onStop={stopPlay}
                    wordCounts={wordCountMap.get(`${group.surah.id}:${ayah.ayah}`)}
                    openWord={rowOpenWord} onWordClick={onWordClick} onWordListen={onWordListen}
                    wordLangs={wordLangs} meals={meals} wbwExtra={wbwExtra} mealExtra={mealExtra} />
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

function Player({ groups, pos, paused, repeat, speed, onStep, onPause, onRepeat, onSpeed, onStop }: {
  groups: ReaderGroup[]; pos: { g: number; a: number }; paused: boolean; repeat: boolean; speed: number;
  onStep: (dir: 1 | -1) => void; onPause: () => void; onRepeat: (v: boolean) => void;
  onSpeed: (v: number) => void; onStop: () => void;
}) {
  const t = useT();
  return (
    <div className="player">
      <button onClick={() => onStep(-1)} title={t('prevAyah')}>⏮</button>
      <button onClick={onPause} title={paused ? t('resume') : t('pause')}>{paused ? '▶' : '⏸'}</button>
      <button onClick={() => onStep(1)} title={t('nextAyah')}>⏭</button>
      <span className="now">
        {groups[pos.g].surah.name_tr} {groups[pos.g].surah.id}:{groups[pos.g].ayahs[pos.a].ayah}
      </span>
      <label className="repeat"><input type="checkbox" checked={repeat} onChange={(e) => onRepeat(e.target.checked)} /> {t('repeat')}</label>
      <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))} title={t('speed')}>
        <option value={0.75}>0.75×</option>
        <option value={1}>1×</option>
        <option value={1.25}>1.25×</option>
        <option value={1.5}>1.5×</option>
      </select>
      <button onClick={onStop} title={t('close')}>✕</button>
    </div>
  );
}

export default function Reader({ groups, showPageMarkers = true, pageNumber, mushaf = false, headExtra }: {
  groups: ReaderGroup[]; showPageMarkers?: boolean; pageNumber?: number; mushaf?: boolean; headExtra?: ReactNode;
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

  // Tembel dil verileri: ur/hi kelime çevirileri + tr/en dışı mealler
  const [wbwExtra, setWbwExtra] = useState<LangMap>({});
  const [mealExtra, setMealExtra] = useState<LangMap>({});
  const loadedRef = useRef(new Set<string>());
  useEffect(() => {
    const load = (kind: 'wbw' | 'meal', lang: string, surah: number) => {
      const key = `${kind}:${lang}:${surah}`;
      if (loadedRef.current.has(key)) return;
      loadedRef.current.add(key);
      void fetch(`/api/${kind}/${lang}/${surah}`)
        .then((r) => (r.ok ? r.json() : {}))
        .then((map: Record<string, string>) => {
          const set = kind === 'wbw' ? setWbwExtra : setMealExtra;
          set((prev) => ({ ...prev, [lang]: { ...prev[lang], ...map } }));
        })
        .catch(() => loadedRef.current.delete(key));
    };
    for (const g of groups) {
      for (const lang of settings.wordLangs) {
        if (!EMBEDDED_WBW.includes(lang as typeof EMBEDDED_WBW[number])) load('wbw', lang, g.surah.id);
      }
      for (const lang of settings.meals) {
        if (!EMBEDDED_MEAL.includes(lang as typeof EMBEDDED_MEAL[number])) load('meal', lang, g.surah.id);
      }
    }
  }, [groups, settings.wordLangs, settings.meals]);

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
    try {
      localStorage.setItem('sk-last', JSON.stringify({
        surah, ayah, name: groups[g].surah.name_tr, page: groups[g].ayahs[a].page,
      }));
    } catch { /* yoksay */ }
  }, [groups, settings.reciter, speed, ensureTimings]);

  const playAt = useCallback((g: number, a: number) => startAudio(g, a, null), [startAudio]);

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
        if (prev.surah !== surah.id) {
          const first = groups[0].ayahs[0];
          localStorage.setItem('sk-last', JSON.stringify({
            surah: surah.id, ayah: first?.ayah ?? 1, name: surah.name_tr, page: first?.page,
          }));
        }
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

  // Hâşiyeler açıksa notlar için sol şerit (gutter) ayrılır → kutular her ekranda görünür
  const cls = [
    'reader',
    settings.mode === 'siyah' ? 'black' : '',
    settings.notes || settings.science ? 'gutter' : '',
  ].filter(Boolean).join(' ');

  const body = (
    <ReaderBody groups={groups} showPageMarkers={showPageMarkers} mode={settings.mode}
      pos={pos} activeWord={activeWord} playAt={playAt} stopPlay={stop} playWord={playWord}
      wordLangs={settings.wordLangs} meals={settings.meals} wbwExtra={wbwExtra} mealExtra={mealExtra} />
  );

  // Üst çubuktaki görünüm geçişi: mushaftan sureye (aynı ayete çapalı) / sureden sayfaya
  const firstAyah = groups[0]?.ayahs[0];
  const toggleHref = mushaf
    ? `/sure/${groups[0].surah.id}#ayet-${groups[0].surah.id}-${firstAyah?.ayah ?? 1}`
    : firstAyah ? `/sayfa/${firstAyah.page}` : '/';

  return (
    <div className={cls} style={{ ['--ar-scale' as string]: settings.fontScale }}>
      <CommentsProvider groups={groups} pageNumber={pageNumber} enabled={settings.comments}>
        <SettingsBar onPlaySurah={() => (pos ? stop() : playAt(0, 0))} playing={pos !== null}
          toggleHref={toggleHref} toggleKey={mushaf ? 'toSurahView' : 'toPageView'}>
          {headExtra}
        </SettingsBar>
        <TargetButtons groups={groups} pageNumber={pageNumber} />
        {mushaf ? (
          <div className="mushaf-frame" data-frame={settings.frame}>
            <div className="mushaf-band" data-frame={settings.frame}>
              <div className="mushaf-inner">{body}</div>
            </div>
          </div>
        ) : body}
        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} onLoadedMetadata={onLoadedMetadata} />
        {pos && <Player groups={groups} pos={pos} paused={paused} repeat={repeat} speed={speed}
          onStep={stepAyah} onPause={togglePause} onRepeat={setRepeat} onSpeed={setSpeed} onStop={stop} />}
      </CommentsProvider>
    </div>
  );
}
