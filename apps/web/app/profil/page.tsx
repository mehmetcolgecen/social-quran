import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { targetHref, targetLabel, type Target } from '@/lib/target';
import ProfileEditor from '@/components/ProfileEditor';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export const metadata = { title: 'Profilim' };
export const dynamic = 'force-dynamic';

type OwnComment = Target & { id: string; body: string; visibility: string; created_at: string; target_type: Target['type']; target_key: string };

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) redirect('/api/auth/login?next=/profil');

  const headers = { authorization: `Bearer ${session.at}` };
  const [meRes, commentsRes] = await Promise.all([
    fetch(`${API_URL}/users/me`, { headers, cache: 'no-store' }),
    fetch(`${API_URL}/users/me/comments`, { headers, cache: 'no-store' }),
  ]);
  if (!meRes.ok) redirect('/api/auth/login?next=/profil');
  const me = await meRes.json();
  const comments: OwnComment[] = commentsRes.ok ? await commentsRes.json() : [];

  return (
    <main>
      <h1>@{me.username}</h1>
      <ProfileEditor displayName={me.display_name} bio={me.bio} />
      <h2>Yorumlarım ({comments.length})</h2>
      {comments.length === 0 && <p className="cmuted">Henüz yorumunuz yok. Okurken ayet yanındaki rozete tıklayın.</p>}
      <ul className="profile-comments">
        {comments.map((c) => {
          const t: Target = { type: c.target_type, key: c.target_key };
          return (
            <li key={c.id}>
              <Link href={targetHref(t)}>{targetLabel(t)}</Link>
              {c.visibility === 'private' && ' 🔒'}
              <p>{c.body}</p>
              <small className="cmuted">{new Date(c.created_at).toLocaleString('tr-TR')}</small>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
