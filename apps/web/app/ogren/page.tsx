'use client';
// Kur'an okumayı öğrenme bölümü — 46 ders, 7 bölüm (lib/ogren.ts) + başta renkli alfabe tablosu.
// İki ses kaynağı: /elifba/<id>.mp3 (yapay zekâ seslendirmesi: harf adları, heceler,
// kelimeler) ve Husary'nin TAM ayet tilaveti (tecvid örnekleri — kırpma yok).
// İlerleme localStorage'da; "Sırayla dinle" dersin tüm seslerini kuyrukla çalar.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AILELER, ALFABE, BOLUMLER, DERSLER, type Ders, type Ornek } from '@/lib/ogren';
import { loadJSON, saveJSON } from '@/lib/store';

const KEY = 'sk-ogren-v2';
const RECITER = 'Husary_64kbps';
const pad3 = (n: number) => String(n).padStart(3, '0');

// Ses anahtarı: 'e:<id>' → /elifba mp3'ü, 'a:<sure:ayet>' → tam ayet tilaveti
const keyOf = (o: { ses?: string; ayet?: string }): string | null =>
  o.ses ? `e:${o.ses}` : o.ayet ? `a:${o.ayet}` : null;
const srcOf = (key: string): string => {
  if (key.startsWith('e:')) return `/elifba/${key.slice(2)}.mp3`;
  const [s, a] = key.slice(2).split(':').map(Number);
  return `/audio/${RECITER}/${pad3(s)}${pad3(a)}.mp3`;
};
const dersKeys = (d: Ders): string[] => {
  const keys: (string | null)[] = [];
  for (const h of d.harfler ?? []) { keys.push(`e:${h.ses}`); h.ornekler.forEach((o) => keys.push(keyOf(o))); }
  d.examples?.forEach((o) => keys.push(keyOf(o)));
  return keys.filter((k): k is string => k !== null);
};

export default function OgrenPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const queueRef = useRef<string[]>([]);

  useEffect(() => {
    const saved = new Set(loadJSON<string[]>(KEY, []));
    setDone(saved);
    const firstOpen = DERSLER.findIndex((d) => !saved.has(d.id));
    if (firstOpen > 0) setCurrent(firstOpen);
  }, []);

  const ders = DERSLER[current];

  const start = (key: string) => {
    const el = audioRef.current!;
    el.src = srcOf(key);
    setPlaying(key);
    void el.play();
  };
  const stop = () => {
    audioRef.current?.pause();
    queueRef.current = [];
    setQueued(false);
    setPlaying(null);
  };
  const toggle = (key: string | null) => {
    if (!key) return;
    if (playing === key) { stop(); return; }
    queueRef.current = [];
    setQueued(false);
    start(key);
  };
  const playAll = () => {
    if (queued) { stop(); return; }
    const keys = dersKeys(ders);
    if (!keys.length) return;
    queueRef.current = keys.slice(1);
    setQueued(true);
    start(keys[0]);
  };
  const advance = () => {
    const next = queueRef.current.shift();
    if (next) start(next);
    else { setQueued(false); setPlaying(null); }
  };
  const selectDers = (i: number) => { stop(); setCurrent(i); };

  const toggleDone = () => {
    const next = new Set(done);
    if (next.has(ders.id)) next.delete(ders.id); else next.add(ders.id);
    setDone(next);
    saveJSON(KEY, [...next]);
    if (!done.has(ders.id) && current < DERSLER.length - 1) selectDers(current + 1);
  };

  const pct = Math.round((done.size / DERSLER.length) * 100);
  const hasAudio = dersKeys(ders).length > 0;

  const ornekKarti = (ex: Ornek, i: number) => {
    const key = keyOf(ex);
    const on = key !== null && playing === key;
    return (
      <button key={i} type="button" disabled={!key}
        className={`ogren-ex${on ? ' playing' : ''}`}
        title={key ? (ex.ayet ? `Tam ayet tilaveti: ${ex.ayet} (Husary)` : 'Dinle') : undefined}
        onClick={() => toggle(key)}>
        <span className="ogren-ar" dir="rtl">{ex.ar}</span>
        <b>{ex.latin}</b>
        {ex.not && <small>{ex.not}</small>}
        {key && <span className="ogren-ex-play">{on ? '⏸ çalıyor' : ex.ayet ? `▶ ayet ${ex.ayet}` : '🔊 dinle'}</span>}
      </button>
    );
  };

  return (
    <main className="ogren-main">
      {/* Çiçekli mushaf çerçevesi: altın dış çerçeve → gül/papatya/lale bandı → iç kâğıt */}
      <div className="ogren-frame"><div className="ogren-band"><div className="ogren-inner">
      <header className="ogren-head">
        <div>
          <h1>🎓 Kur&rsquo;an Okumayı Öğren</h1>
          <p className="cmuted">
            Elifbadan tecvide {DERSLER.length} ders. Harfler, heceler ve kelimeler yapay zekâ
            seslendirmesiyle tane tane; tecvid örnekleri Husary&rsquo;nin tam ayet tilavetiyle.
          </p>
        </div>
        <div className="ogren-score" aria-label={`İlerleme yüzde ${pct}`}>
          <b>%{pct}</b>
          <small>{done.size}/{DERSLER.length} ders</small>
          <span className="mem-progress"><span className="mem-bar" style={{ width: `${pct}%` }} /></span>
        </div>
      </header>

      <section className="alfabe" aria-label="Elifba alfabesi">
        <div className="alfabe-head">
          <h2>۞ Elifba: 28 Harf</h2>
          <small className="cmuted">Harfe dokunun, adını dinleyin — renkler ilk beş harf dersinin aileleridir.</small>
        </div>
        <div className="alfabe-lejant">
          {Object.entries(AILELER).map(([no, a]) => (
            <span key={no} style={{ ['--h' as string]: a.hue }}><i />{no}. {a.ad}</span>
          ))}
        </div>
        <div className="alfabe-grid">
          {ALFABE.map((h) => {
            const k = `e:${h.ses}`;
            return (
              <button key={h.ses} type="button"
                className={`alfabe-harf${playing === k ? ' playing' : ''}`}
                style={{ ['--h' as string]: AILELER[h.aile].hue }}
                title={`${h.name} — ${AILELER[h.aile].ad} (${h.aile}. ders)`} onClick={() => toggle(k)}>
                <span dir="rtl">{h.ar}</span>
                <small>{playing === k ? '⏸' : ''} {h.name}</small>
              </button>
            );
          })}
        </div>
      </section>

      <div className="ogren-layout">
        <nav className="ogren-nav" aria-label="Dersler">
          {BOLUMLER.map((bolum) => (
            <div key={bolum} className="ogren-nav-group">
              <small>{bolum}</small>
              {DERSLER.map((d, i) => d.bolum === bolum && (
                <button key={d.id} className={`${i === current ? 'on' : ''}${done.has(d.id) ? ' done' : ''}`}
                  onClick={() => selectDers(i)}>
                  <span className="ogren-nav-icon">{done.has(d.id) ? '✓' : d.icon}</span>
                  <span className="ogren-nav-title">{i + 1}. {d.title}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <article className="ogren-body">
          <div className="ogren-body-head">
            <h2>{ders.icon} {current + 1}. {ders.title}</h2>
            {hasAudio && (
              <button className="ogren-play-all" onClick={playAll}>
                {queued ? '⏹ Durdur' : '▶ Sırayla dinle'}
              </button>
            )}
          </div>
          <p className="ogren-intro">{ders.intro}</p>

          {ders.harfler && (
            <div className="harf-grid">
              {ders.harfler.map((h) => {
                const nameKey = `e:${h.ses}`;
                return (
                  <div key={h.ses} className="harf-card">
                    <button type="button" className={`harf-glyph${playing === nameKey ? ' playing' : ''}`}
                      title={`${h.name} harfini dinle`} onClick={() => toggle(nameKey)}>
                      <span dir="rtl">{h.ar}</span>
                      <em>{playing === nameKey ? '⏸' : '🔊'}</em>
                    </button>
                    <div className="harf-info">
                      <b>{h.name}</b>
                      {h.formlar && (
                        <span className="harf-forms" dir="rtl" title="sonda · ortada · başta">
                          <span>{h.formlar[0]}</span><span>{h.formlar[1]}</span><span>{h.formlar[2]}</span>
                        </span>
                      )}
                      {h.not && <small>{h.not}</small>}
                      <span className="harf-words">
                        {h.ornekler.map((o, j) => {
                          const k = keyOf(o);
                          const on = k !== null && playing === k;
                          return (
                            <button key={j} type="button" className={`harf-word${on ? ' playing' : ''}`}
                              title={o.not} onClick={() => toggle(k)}>
                              <span dir="rtl">{o.ar}</span>
                              <small>{on ? '⏸' : '▶'} {o.latin}{o.not ? ` — ${o.not}` : ''}</small>
                            </button>
                          );
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {ders.examples && (
            <div className={`ogren-examples${ders.examples.every((e) => !e.not) ? ' compact' : ''}`}>
              {ders.examples.map(ornekKarti)}
            </div>
          )}

          {ders.tip && <p className="ogren-tip">💡 {ders.tip}</p>}

          <div className="ogren-actions">
            <button className="btn" disabled={current === 0} onClick={() => selectDers(current - 1)}>← Önceki</button>
            <button className={`btn primary${done.has(ders.id) ? ' muted' : ''}`} onClick={toggleDone}>
              {done.has(ders.id) ? '↺ Tamamlanmadı say' : '✓ Dersi tamamladım'}
            </button>
            <button className="btn" disabled={current === DERSLER.length - 1} onClick={() => selectDers(current + 1)}>Sonraki →</button>
            {ders.id === 'pratik' && <Link className="btn primary" href="/sure/1">📖 Fatiha&rsquo;yı aç →</Link>}
          </div>
        </article>
      </div>
      </div></div></div>

      <audio ref={audioRef} onEnded={advance} onError={() => { if (playing) advance(); }} />
    </main>
  );
}
