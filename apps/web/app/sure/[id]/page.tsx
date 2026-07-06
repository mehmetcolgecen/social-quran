import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReciters, getSurah, getSurahContent } from '@/lib/db';
import Reader from '@/components/Reader';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const id = Number((await params).id);
  const surah = id >= 1 && id <= 114 ? getSurah(id) : null;
  return { title: surah ? `${surah.name_tr} Suresi` : 'Sure' };
}

export default async function SurePage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1 || id > 114) notFound();
  const content = getSurahContent(id);
  if (!content) notFound();
  const { surah } = content;
  return (
    <main>
      <div className="sure-head">
        <div className="nav">
          {id > 1 ? <Link href={`/sure/${id - 1}`}>← {getSurah(id - 1)!.name_tr}</Link> : <span />}
          {id < 114 ? <Link href={`/sure/${id + 1}`}>{getSurah(id + 1)!.name_tr} →</Link> : <span />}
        </div>
        <p className="ar">{surah.name_arabic}</p>
        <p className="meta">
          {surah.id}. {surah.name_tr} Suresi ({surah.name_en}) · {surah.verses_count} ayet ·{' '}
          {surah.revelation_place === 'makkah' ? 'Mekkî' : 'Medenî'} ·{' '}
          <Link href={`/sayfa/${content.ayahs[0].page}`}>Sayfa {content.ayahs[0].page}</Link>
        </p>
      </div>
      <Reader groups={[content]} reciters={getReciters()} />
    </main>
  );
}
