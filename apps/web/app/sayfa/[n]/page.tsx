import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPageContent, getReciters } from '@/lib/db';
import Reader from '@/components/Reader';

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: `Sayfa ${(await params).n}` };
}

export default async function SayfaPage({ params }: Props) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 604) notFound();
  const groups = getPageContent(n);
  return (
    <main>
      <div className="sure-head">
        <div className="nav">
          {n > 1 ? <Link href={`/sayfa/${n - 1}`}>← Sayfa {n - 1}</Link> : <span />}
          <b>Sayfa {n} / 604</b>
          {n < 604 ? <Link href={`/sayfa/${n + 1}`}>Sayfa {n + 1} →</Link> : <span />}
        </div>
        <p className="meta">Sayfa sınırı ayet ortasından geçebilir; ayetler bütün olarak gösterilir.</p>
      </div>
      <Reader groups={groups} reciters={getReciters()} showPageMarkers={false} pageNumber={n} />
    </main>
  );
}
