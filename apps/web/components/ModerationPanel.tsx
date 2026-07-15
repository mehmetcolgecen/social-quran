'use client';
// Yönetim paneli: Şikâyetler (mevcut kuyruk) + Tüm yorumlar (ara/gizle/sil) +
// Kullanıcılar (istatistik tablosu). API uçları moderator/admin rolü ister;
// 403 gelirse yetki uyarısı gösterilir. Private hâşiyeler kişiseldir, listelenmez.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { targetHref, targetLabel, type Target } from '@/lib/target';
import ModerationList from './ModerationList';

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('tr-TR') : '—');

type ModComment = {
  id: number; target_type: Target['type']; target_key: string; body: string;
  created_at: string; hidden_at: string | null;
  username: string; display_name: string; like_count: number; report_count: number;
};

type Overview = {
  totals: {
    users: number; comments: number; hidden_comments: number;
    comments_7d: number; likes: number; open_reports: number;
  };
  users: {
    username: string; display_name: string; created_at: string;
    comment_count: number; hidden_count: number; last_comment_at: string | null;
    likes_received: number; reports_received: number;
  }[];
};

function CommentsTab({ username, onClearUser }: { username: string | null; onClearUser: () => void }) {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState(''); // gönderilmiş arama
  const [status, setStatus] = useState<'all' | 'visible' | 'hidden'>('all');
  const [items, setItems] = useState<ModComment[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async (offset: number, append: boolean) => {
    const params = new URLSearchParams({ status, offset: String(offset) });
    if (query) params.set('q', query);
    if (username) params.set('username', username);
    const res = await fetch(`/api/social/moderation/comments?${params}`);
    if (res.status === 403 || res.status === 401) { setDenied(true); return; }
    const data: { items: ModComment[]; has_more: boolean } = res.ok
      ? await res.json()
      : { items: [], has_more: false };
    setItems((prev) => (append && prev ? [...prev, ...data.items] : data.items));
    setHasMore(data.has_more);
  }, [status, query, username]);

  useEffect(() => { setItems(null); void load(0, false); }, [load]);

  async function act(id: number, action: 'hide' | 'unhide' | 'delete') {
    if (action === 'delete' && !window.confirm('Bu yorum kalıcı olarak silinsin mi?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/social/moderation/comments/${id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      if (action === 'delete') setItems((prev) => prev?.filter((c) => c.id !== id) ?? null);
      else {
        setItems((prev) => prev?.map((c) =>
          c.id === id ? { ...c, hidden_at: action === 'hide' ? new Date().toISOString() : null } : c) ?? null);
      }
    } finally {
      setBusy(null);
    }
  }

  if (denied) return <p className="cerror">Bu sayfa için moderatör yetkisi gerekli.</p>;

  return (
    <>
      <form className="mod-filter" onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Yorum metninde ara…"
          aria-label="Yorumlarda ara"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Durum">
          <option value="all">Tümü</option>
          <option value="visible">Görünür</option>
          <option value="hidden">Gizlenmiş</option>
        </select>
        <button className="btn" type="submit">Ara</button>
        {username && (
          <span className="mod-chip">
            @{username}
            <button type="button" onClick={onClearUser} title="Kullanıcı filtresini kaldır">✕</button>
          </span>
        )}
      </form>
      {!items && <p className="cmuted">Yükleniyor…</p>}
      {items && items.length === 0 && <p className="cmuted">Eşleşen yorum yok.</p>}
      {items && items.length > 0 && (
        <ul className="profile-comments">
          {items.map((c) => {
            const t: Target = { type: c.target_type, key: c.target_key };
            return (
              <li key={c.id} className={c.hidden_at ? 'hidden-comment' : undefined}>
                <div className="chead">
                  <span>
                    <Link href={`/kullanici/${c.username}`}><b>@{c.username}</b></Link>
                    {' — '}
                    <Link href={targetHref(t)}>{targetLabel(t)}</Link>
                    {c.hidden_at && <> <span className="mod-badge warn">gizli</span></>}
                    {c.report_count > 0 && <> <span className="mod-badge warn">{c.report_count} şikâyet</span></>}
                  </span>
                  <span>{fmt(c.created_at)}</span>
                </div>
                <p className="cbody">{c.body}</p>
                <div className="cactions">
                  <span className="cmuted">❤ {c.like_count}</span>
                  {c.hidden_at
                    ? <button disabled={busy === c.id} onClick={() => act(c.id, 'unhide')}>Geri göster</button>
                    : <button disabled={busy === c.id} onClick={() => act(c.id, 'hide')}>Gizle</button>}
                  <button disabled={busy === c.id} onClick={() => act(c.id, 'delete')}>Sil</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {items && hasMore && (
        <button className="btn mod-more" onClick={() => void load(items.length, true)}>Daha fazla yükle</button>
      )}
    </>
  );
}

function UsersTab({ onPickUser }: { onPickUser: (username: string) => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    void fetch('/api/social/moderation/overview').then(async (res) => {
      if (res.status === 403 || res.status === 401) { setDenied(true); return; }
      if (res.ok) setData(await res.json());
    });
  }, []);

  if (denied) return <p className="cerror">Bu sayfa için moderatör yetkisi gerekli.</p>;
  if (!data) return <p className="cmuted">Yükleniyor…</p>;
  const { totals, users } = data;

  return (
    <>
      <div className="plan-cards">
        <div className="plan-card"><span className="plan-big">{totals.users}</span><small>kayıtlı kullanıcı</small></div>
        <div className="plan-card"><span className="plan-big">{totals.comments}</span><small>yorum (son 7 gün: {totals.comments_7d})</small></div>
        <div className="plan-card"><span className="plan-big">{totals.likes}</span><small>beğeni</small></div>
        <div className="plan-card"><span className="plan-big">{totals.hidden_comments}</span><small>gizlenmiş yorum</small></div>
        <div className="plan-card"><span className="plan-big">{totals.open_reports}</span><small>açık şikâyet</small></div>
      </div>
      <div className="mod-table-wrap">
        <table className="mod-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th className="num-cell">Yorum</th>
              <th className="num-cell">Gizli</th>
              <th className="num-cell">Beğeni</th>
              <th className="num-cell">Şikâyet</th>
              <th>Son yorum</th>
              <th>Kayıt</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username}>
                <td>
                  <Link href={`/kullanici/${u.username}`}><b>@{u.username}</b></Link>
                  {u.display_name && u.display_name !== u.username && <> · {u.display_name}</>}
                </td>
                <td className="num-cell">{u.comment_count}</td>
                <td className="num-cell">{u.hidden_count}</td>
                <td className="num-cell">{u.likes_received}</td>
                <td className="num-cell">{u.reports_received}</td>
                <td>{fmt(u.last_comment_at)}</td>
                <td>{fmt(u.created_at)}</td>
                <td>
                  <button className="btn" onClick={() => onPickUser(u.username)}>Yorumları</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="cmuted">
        Hesap işlemleri (devre dışı bırakma, silme, parola) Keycloak yönetim konsolundadır;
        private hâşiyeler kişiseldir ve burada listelenmez.
      </p>
    </>
  );
}

export default function ModerationPanel() {
  const [tab, setTab] = useState<'reports' | 'comments' | 'users'>('reports');
  const [userFilter, setUserFilter] = useState<string | null>(null);

  return (
    <>
      <div className="mod-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'reports'} className={tab === 'reports' ? 'on' : undefined}
          onClick={() => setTab('reports')}>🚩 Şikâyetler</button>
        <button role="tab" aria-selected={tab === 'comments'} className={tab === 'comments' ? 'on' : undefined}
          onClick={() => setTab('comments')}>💬 Tüm yorumlar</button>
        <button role="tab" aria-selected={tab === 'users'} className={tab === 'users' ? 'on' : undefined}
          onClick={() => setTab('users')}>👥 Kullanıcılar</button>
      </div>
      {tab === 'reports' && <ModerationList />}
      {tab === 'comments' && (
        <CommentsTab username={userFilter} onClearUser={() => setUserFilter(null)} />
      )}
      {tab === 'users' && (
        <UsersTab onPickUser={(u) => { setUserFilter(u); setTab('comments'); }} />
      )}
    </>
  );
}
