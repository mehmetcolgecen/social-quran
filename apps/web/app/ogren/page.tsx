'use client';
// Kur'an okumayı öğrenme bölümü — adım adım, bol örnekli, tecvid dahil.
// Örnekler Husary tilavetinden gerçek kelime kesitleriyle SESLİ dinlenebilir (▶);
// harflerde ayrıca deneysel yapay zeka sesi (🔈, tarayıcı TTS). İlerleme localStorage'da.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DERSLER } from '@/lib/ogren';
import { loadJSON, saveJSON } from '@/lib/store';

const KEY = 'sk-ogren';
const RECITER = 'Husary_64kbps';
type Found = { loc: string; ar: string; tr: string | null } | null;

const pad3 = (n: number) => String(n).padStart(3, '0');

export default function OgrenPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [textMap, setTextMap] = useState<Record<string, Found>>({});
  const [letterMap, setLetterMap] = useState<Record<string, Found>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAtRef = useRef<number | null>(null);
  const seekRef = useRef<number | null>(null);
  const timingsRef = useRef(new Map<number, Map<number, number[][]>>());

  useEffect(() => {
    const saved = new Set(loadJSON<string[]>(KEY, []));
    setDone(saved);
    const firstOpen = DERSLER.findIndex((d) => !saved.has(d.id));
    if (firstOpen > 0) setCurrent(firstOpen);
  }, []);

  const ders = DERSLER[current];
  const isHarfler = ders.id === 'harfler';

  // Ders örnekleri için Kur'an'dan kelime konumları (sesli çalmak için)
  useEffect(() => {
    const texts = isHarfler ? [] : ders.examples.map((e) => e.ar).filter((t) => !textMap[t]);
    const letters = isHarfler ? ders.examples.map((e) => e.ar).filter((l) => !letterMap[l]) : [];
    if (!texts.length && !letters.length) return;
    void fetch('/api/ogren', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texts, letters }),
    }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setTextMap((prev) => ({ ...prev, ...d.texts }));
      setLetterMap((prev) => ({ ...prev, ...d.letters }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const play = useCallback(async (loc: string) => {
    const [s, a, p] = loc.split(':').map(Number);
    if (!timingsRef.current.has(s)) {
      try {
        const rows: { ayah: number; segments: number[][] }[] = await (await fetch(`/api/timings/${RECITER}/${s}`)).json();
        timingsRef.current.set(s, new Map(rows.map((r) => [r.ayah, r.segments])));
      } catch { timingsRef.current.set(s, new Map()); }
    }
    const seg = timingsRef.current.get(s)?.get(a)?.find((x) => x[0] === p - 1);
    const el = audioRef.current!;
    seekRef.current = seg ? seg[2] : null;
    stopAtRef.current = seg ? seg[3] : null;
    el.src = `/audio/${RECITER}/${pad3(s)}${pad3(a)}.mp3`;
    void el.play();
  }, []);

  const speak = useCallback((text: string) => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA';
      u.rate = 0.7;
      speechSynthesis.speak(u);
    } catch { /* desteklenmiyorsa sessiz */ }
  }, []);

  const toggleDone = () => {
    const next = new Set(done);
    if (next.has(ders.id)) next.delete(ders.id); else next.add(ders.id);
    setDone(next);
    saveJSON(KEY, [...next]);
    if (!done.has(ders.id) && current < DERSLER.length - 1) setCurrent(current + 1);
  };

  const pct = Math.round((done.size / DERSLER.length) * 100);

  return (
    <main>
      <h1>🎓 Kur&rsquo;an Okumayı Öğren</h1>
      <p className="cmuted">
        10 adımda elifbadan tecvidli okumaya. <b>▶</b> gerçek tilavetten (Husary) kelime kesiti çalar,{' '}
        <b>🔈</b> deneysel yapay zeka sesidir.
      </p>
      <div className="mem-progress" style={{ maxWidth: '28rem' }}>
        <div className="mem-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="mem-motivation">
        {pct === 0 ? '🌱 Besmele çekin, başlayalım!' : pct < 100 ? `💪 ${done.size}/${DERSLER.length} ders tamam — devam!` : '🌟 Tebrikler! Artık Fatiha sayfasında pratiğe geçin.'}
      </p>

      <div className="ogren-layout">
        <nav className="ogren-nav">
          {DERSLER.map((d, i) => (
            <button key={d.id} className={`${i === current ? 'on' : ''}${done.has(d.id) ? ' done' : ''}`}
              onClick={() => setCurrent(i)}>
              <span>{done.has(d.id) ? '✅' : d.icon}</span> {i + 1}. {d.title}
            </button>
          ))}
        </nav>

        <article className="ogren-body">
          <h2>{ders.icon} {current + 1}. {ders.title}</h2>
          <p>{ders.intro}</p>
          <div className={`ogren-examples${isHarfler ? ' compact' : ''}`}>
            {ders.examples.map((ex, i) => {
              const found = isHarfler ? letterMap[ex.ar] : textMap[ex.ar];
              return (
                <div key={i} className="ogren-ex">
                  <span className="ogren-ar" dir="rtl">{ex.ar}</span>
                  <b>{ex.latin}</b>
                  {ex.not && <small className="cmuted">{ex.not}</small>}
                  {isHarfler && found && (
                    <small className="ogren-sample" dir="rtl" title={found.tr ?? ''}>{found.ar}</small>
                  )}
                  <span className="ogren-play">
                    {found && (
                      <button title={`Kur'an'dan dinle: ${found.ar}${found.tr ? ` (${found.tr})` : ''} — ${found.loc}`}
                        onClick={() => play(found.loc)}>▶</button>
                    )}
                    <button title="Yapay zeka sesi (deneysel)" onClick={() => speak(ex.ar)}>🔈</button>
                  </span>
                </div>
              );
            })}
          </div>
          {ders.tip && <p className="ogren-tip">💡 {ders.tip}</p>}
          <div className="ogren-actions">
            <button className="view-toggle" style={{ cursor: 'pointer' }} disabled={current === 0}
              onClick={() => setCurrent(current - 1)}>← Önceki</button>
            <button className={`csubmit${done.has(ders.id) ? ' muted' : ''}`} onClick={toggleDone}>
              {done.has(ders.id) ? '↺ Tamamlanmadı say' : '✓ Dersi tamamladım'}
            </button>
            <button className="view-toggle" style={{ cursor: 'pointer' }} disabled={current === DERSLER.length - 1}
              onClick={() => setCurrent(current + 1)}>Sonraki →</button>
          </div>
          {ders.id === 'pratik' && (
            <p><Link className="view-toggle" href="/sure/1">📖 Fatiha&rsquo;yı aç ve uygula →</Link></p>
          )}
        </article>
      </div>
      <audio ref={audioRef}
        onLoadedMetadata={() => {
          const el = audioRef.current!;
          if (seekRef.current != null) { el.currentTime = seekRef.current / 1000; seekRef.current = null; }
        }}
        onTimeUpdate={() => {
          const el = audioRef.current!;
          if (stopAtRef.current != null && el.currentTime * 1000 >= stopAtRef.current) {
            el.pause(); stopAtRef.current = null;
          }
        }}
      />
    </main>
  );
}
