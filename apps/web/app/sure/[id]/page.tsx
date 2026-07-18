import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSurah, getSurahContent } from '@/lib/db';
import { Tt } from '@/lib/i18n';
import Reader from '@/components/Reader';
import MemorizeSidebar, { type UniqueWord } from '@/components/MemorizeSidebar';

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

  // Suredeki benzersiz kelimeler (ilk görülme sırasıyla) — ezber listesi için
  const unique = new Map<string, UniqueWord>();
  for (const ayah of content.ayahs) {
    for (const w of ayah.words) {
      const existing = unique.get(w.ar);
      if (existing) existing.count++;
      else unique.set(w.ar, { ar: w.ar, ari: w.ari, tr: w.tr, en: w.en, count: 1 });
    }
  }

  // Sure geçişleri hem üstte hem altta (uzun surelerde yukarı kaydırmadan geçilebilsin)
  const nav = (
    <div className="nav">
      {id > 1 ? <Link href={`/sure/${id - 1}`}>← {getSurah(id - 1)!.name_tr}</Link> : <span />}
      {id < 114 ? <Link href={`/sure/${id + 1}`}>{getSurah(id + 1)!.name_tr} →</Link> : <span />}
    </div>
  );

  return (
    <main className="sure-main">
      <div className="sure-head">
        {nav}
        <p className="meta">
          {surah.id}. {surah.name_tr} Suresi ({surah.name_en}) · {surah.verses_count} <Tt k="ayahs" /> ·{' '}
          {surah.revelation_place === 'makkah' ? 'Mekkî' : 'Medenî'}
        </p>
      </div>
      <div className="sayfa-layout">
        <div className="sayfa-content">
          <Reader groups={[content]} />
        </div>
        <MemorizeSidebar words={[...unique.values()]} titleKey="memorizeTitleSurah" />
      </div>
      <div className="sure-head foot">{nav}</div>
    </main>
  );
}
