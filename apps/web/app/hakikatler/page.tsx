import Link from 'next/link';
import { MUCIZELER } from '@/lib/mucizeler';
import { getSurah } from '@/lib/db';

export const metadata = { title: 'Bilimsel Hakikatler' };

// DB'den okur; veri çalışma anında PVC'den gelir, build'de prerender edilemez.
export const dynamic = 'force-dynamic';

// İlim/tefekkür notlarının toplu dizini — karta tıklayınca ilgili ayete gider.
export default function HakikatlerPage() {
  const items = Object.entries(MUCIZELER)
    .map(([key, m]) => {
      const [s, a] = key.split(':').map(Number);
      return { key, s, a, surah: getSurah(s)!, ...m };
    })
    .sort((x, y) => x.s - y.s || x.a - y.a);

  return (
    <main>
      <h1>🔬 Bilimsel Hakikatler</h1>
      <p className="cmuted" style={{ maxWidth: '46rem' }}>
        Ayetler ile modern bilginin buluştuğu noktalara düşülmüş {items.length} tefekkür notu.
        Üslup bilinçli olarak mütevazıdır: bunlar kesin &ldquo;bilimsel kanıt&rdquo; iddiası değil,
        düşünmeye davettir. Karta tıklayınca ilgili ayete gidersiniz; okuma sayfasında aynı notu
        hâşiye olarak ayetin yanında görürsünüz.
      </p>
      <div className="hakikat-grid">
        {items.map((it) => (
          <Link key={it.key} className="hakikat-card" href={`/sure/${it.s}#ayet-${it.s}-${it.a}`}>
            <span className="hakikat-key">
              <b>{it.surah.name_tr}</b> {it.key}
              <span className="hakikat-ar" dir="rtl">{it.surah.name_arabic}</span>
            </span>
            <q>{it.quote}</q>
            <p>{it.note}</p>
            <span className="hakikat-cta">Ayete git →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
