'use client';
// Kur'an okumayı öğrenme bölümü — adım adım, bol örnekli, tecvid dahil.
// İlerleme localStorage'da; her ders "tamamlandı" işaretlenebilir.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DERSLER } from '@/lib/ogren';
import { loadJSON, saveJSON } from '@/lib/store';

const KEY = 'sk-ogren';

export default function OgrenPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const saved = new Set(loadJSON<string[]>(KEY, []));
    setDone(saved);
    const firstOpen = DERSLER.findIndex((d) => !saved.has(d.id));
    if (firstOpen > 0) setCurrent(firstOpen);
  }, []);

  const ders = DERSLER[current];
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
      <p className="cmuted">10 adımda elifbadan tecvidli okumaya — bol örnekli. İstediğiniz derse atlayabilirsiniz.</p>
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
          <div className={`ogren-examples${ders.id === 'harfler' ? ' compact' : ''}`}>
            {ders.examples.map((ex, i) => (
              <div key={i} className="ogren-ex">
                <span className="ogren-ar" dir="rtl">{ex.ar}</span>
                <b>{ex.latin}</b>
                {ex.not && <small className="cmuted">{ex.not}</small>}
              </div>
            ))}
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
    </main>
  );
}
