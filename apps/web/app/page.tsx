import Link from 'next/link';
import { getSurahs } from '@/lib/db';
import { Tt } from '@/lib/i18n';
import { LoginError } from '@/components/Chrome';
import ContinueCard from '@/components/ContinueCard';
import HomeWidgets from '@/components/HomeWidgets';
import OgrenHero from '@/components/OgrenHero';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const { hata } = await searchParams;
  const surahs = getSurahs();
  return (
    <main>
      {hata && <LoginError code={hata} />}
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
                <small>{s.verses_count} <Tt k="ayahs" /> · <Tt k={s.revelation_place === 'makkah' ? 'mekki' : 'medeni'} /></small>
              </span>
              <span className="ar">{s.name_arabic}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
