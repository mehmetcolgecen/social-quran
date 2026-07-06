import Link from 'next/link';
import { getSurahs } from '@/lib/db';
import ContinueCard from '@/components/ContinueCard';

export default function HomePage() {
  const surahs = getSurahs();
  return (
    <main>
      <ContinueCard />
      <ul className="surah-grid">
        {surahs.map((s) => (
          <li key={s.id}>
            <Link className="surah-card" href={`/sure/${s.id}`}>
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
