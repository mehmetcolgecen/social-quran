import Link from 'next/link';
import { getSurahs } from '@/lib/db';
import ContinueCard from '@/components/ContinueCard';
import HomeWidgets from '@/components/HomeWidgets';
import OgrenHero from '@/components/OgrenHero';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const { hata } = await searchParams;
  const surahs = getSurahs();
  return (
    <main>
      {hata && (
        <p className="cerror" role="alert">
          ⚠️ Giriş tamamlanamadı ({hata === 'state' ? 'oturum doğrulaması eşleşmedi' : hata === 'token' ? 'kimlik sunucusuna ulaşılamadı' : hata === 'kimlik' ? 'kimlik sunucusu çalışmıyor — yerel geliştirmede dev yığınını başlatın (packages/devstack)' : 'akış yarıda kesildi'}).
          Lütfen tekrar <a href="/api/auth/login?next=/">giriş yapmayı deneyin</a>.
        </p>
      )}
      <OgrenHero />
      <div className="home-widgets-row">
        <ContinueCard />
        <HomeWidgets />
      </div>
      <ul className="surah-grid">
        {surahs.map((s) => (
          <li key={s.id}>
            <Link className="surah-card" href={`/sayfa/${s.start_page}#ayet-${s.id}-1`}>
              <span className="no">{s.id}</span>
              <span className="names">
                <b>{s.name_tr}</b>
                <small>{s.verses_count} ayet · {s.revelation_place === 'makkah' ? 'Mekkî' : 'Medenî'}</small>
              </span>
              <span className="ar">{s.name_arabic}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
