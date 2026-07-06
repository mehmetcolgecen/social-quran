import Link from 'next/link';
import { search } from '@/lib/db';
import { flagOf } from '@/lib/langs';

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return { title: q ? `"${q}" araması` : 'Ara' };
}

export default async function AraPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? '').trim();
  const results = q ? search(q) : null;
  const ayahHref = (key: string) => {
    const [s, a] = key.split(':');
    return `/sure/${s}#ayet-${s}-${a}`;
  };

  return (
    <main>
      <h1>🔍 Arama</h1>
      <form action="/ara" className="search-page-form">
        <input name="q" defaultValue={q} placeholder="Sure adı, 2:255, bakara 100 veya meal metni…" autoFocus />
        <button type="submit">Ara</button>
      </form>
      {!q && <p className="cmuted">Örnekler: <b>bakara 255</b> · <b>36:12</b> · <b>sabır</b> · <b>mercy</b> · <b>fatiha</b></p>}
      {results && (
        <>
          {results.direct && (
            <section>
              <h2>Ayet</h2>
              <ul className="profile-comments">
                <li>
                  <Link href={ayahHref(results.direct.key)}><b>{results.direct.key}</b></Link>
                  <p>{results.direct.meal}</p>
                </li>
              </ul>
            </section>
          )}
          {results.surahs.length > 0 && (
            <section>
              <h2>Sureler</h2>
              <div className="target-buttons">
                {results.surahs.map((s) => (
                  <Link key={s.id} className="view-toggle"
                    href={s.matchedAyah ? `/sure/${s.id}#ayet-${s.id}-${s.matchedAyah}` : `/sure/${s.id}`}>
                    {s.id}. {s.name_tr}{s.matchedAyah ? `:${s.matchedAyah}` : ''} — {s.name_arabic}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.meals.length > 0 && (
            <section>
              <h2>Meallerde ({results.meals.length})</h2>
              <ul className="profile-comments">
                {results.meals.map((m) => (
                  <li key={`${m.verse_key}-${m.lang}`}>
                    <Link href={ayahHref(m.verse_key)}><b>{m.verse_key}</b></Link> {flagOf(m.lang)}
                    <p>{m.snippet}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.words.length > 0 && (
            <section>
              <h2>Kelime anlamlarında ({results.words.length})</h2>
              <div className="target-buttons">
                {results.words.map((w) => (
                  <Link key={w.location} className="view-toggle" href={ayahHref(w.location.split(':').slice(0, 2).join(':'))}>
                    <span dir="rtl" style={{ fontFamily: 'var(--font-ar)', fontSize: '1.15rem' }}>{w.ar}</span> — {w.tr} ({w.location})
                  </Link>
                ))}
              </div>
            </section>
          )}
          {!results.direct && !results.surahs.length && !results.meals.length && !results.words.length && (
            <p className="cmuted">"{q}" için sonuç bulunamadı. Arapça metin araması henüz desteklenmiyor; meal veya sure adıyla deneyin.</p>
          )}
        </>
      )}
    </main>
  );
}
