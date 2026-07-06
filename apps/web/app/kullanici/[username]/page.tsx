import Link from 'next/link';
import { notFound } from 'next/navigation';
import { targetHref, targetLabel, type Target } from '@/lib/target';
import Stars from '@/components/Stars';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

type Props = { params: Promise<{ username: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  return { title: `@${(await params).username}` };
}

export default async function KullaniciPage({ params }: Props) {
  const { username } = await params;
  if (!/^[a-zA-Z0-9_]{1,40}$/.test(username)) notFound();
  const res = await fetch(`${API_URL}/users/${username}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const profile = await res.json();

  type PComment = { id: string; target_type: Target['type']; target_key: string; body: string; created_at: string; like_count: number };
  return (
    <main>
      <h1>{profile.display_name} <small className="cmuted">@{profile.username}</small></h1>
      <Stars stars={profile.stars} totalLikes={profile.total_likes} />
      {profile.bio && <p>{profile.bio}</p>}
      <p className="cmuted">Üyelik: {new Date(profile.created_at).toLocaleDateString('tr-TR')}</p>
      {profile.top_comments.length > 0 && (
        <>
          <h2>En beğenilen yorumları</h2>
          <ul className="profile-comments top">
            {profile.top_comments.map((c: PComment) => {
              const t: Target = { type: c.target_type, key: c.target_key };
              return (
                <li key={c.id}>
                  <Link href={targetHref(t)}>{targetLabel(t)}</Link>
                  <p>{c.body}</p>
                  <small className="cmuted">♥ {c.like_count}</small>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <h2>Herkese açık yorumları ({profile.comments.length})</h2>
      <ul className="profile-comments">
        {profile.comments.map((c: PComment) => {
          const t: Target = { type: c.target_type, key: c.target_key };
          return (
            <li key={c.id}>
              <Link href={targetHref(t)}>{targetLabel(t)}</Link>
              <p>{c.body}</p>
              <small className="cmuted">♥ {c.like_count} · {new Date(c.created_at).toLocaleString('tr-TR')}</small>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
