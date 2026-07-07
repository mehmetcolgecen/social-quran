import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPageContent, getReciters } from '@/lib/db';
import { Tt } from '@/lib/i18n';
import Reader from '@/components/Reader';
import MemorizeSidebar, { type UniqueWord } from '@/components/MemorizeSidebar';
import PageReadButton from '@/components/PageReadButton';

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `Sayfa ${(await params).n}` };
}

export default async function SayfaPage({ params }: Props) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 604) notFound();
  const groups = getPageContent(n);

  // Sayfadaki benzersiz kelimeler (ilk görülme sırasıyla) — ezber listesi için
  const unique = new Map<string, UniqueWord>();
  for (const g of groups) {
    for (const ayah of g.ayahs) {
      for (const w of ayah.words) {
        const existing = unique.get(w.ar);
        if (existing) existing.count++;
        else unique.set(w.ar, { ar: w.ar, tr: w.tr, en: w.en, count: 1 });
      }
    }
  }

  return (
    <main className="sayfa-main">
      <div className="sure-head">
        <div className="nav">
          {n > 1 ? <Link href={`/sayfa/${n - 1}`}>← Sayfa {n - 1}</Link> : <span />}
          <b>Sayfa {n} / 604</b>
          {n < 604 ? <Link href={`/sayfa/${n + 1}`}>Sayfa {n + 1} →</Link> : <span />}
        </div>
        <p className="meta">
          <Link className="view-toggle" href={`/sure/${groups[0].surah.id}#ayet-${groups[0].surah.id}-${groups[0].ayahs[0].ayah}`}>
            <Tt k="toSurahView" />
          </Link>{' '}
          <PageReadButton page={n} />
        </p>
      </div>
      <div className="sayfa-layout">
        <div className="sayfa-content">
          <Reader groups={groups} reciters={getReciters()} showPageMarkers={false} pageNumber={n} mushaf />
        </div>
        <MemorizeSidebar words={[...unique.values()]} />
      </div>
    </main>
  );
}
