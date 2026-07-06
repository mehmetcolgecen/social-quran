'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { targetHref, targetLabel, type Target } from '@/lib/target';

type Report = {
  id: string; reason: string; created_at: string; reporter_username: string;
  comment_id: string; comment_body: string; target_type: Target['type']; target_key: string;
  author_username: string; author_display_name: string; hidden_at: string | null;
};

export default function ModerationList() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/social/moderation/reports?status=open');
    if (res.status === 403 || res.status === 401) { setDenied(true); return; }
    setReports(res.ok ? await res.json() : []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function resolve(id: string, action: 'hide' | 'dismiss') {
    await fetch(`/api/social/moderation/reports/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  if (denied) return <p className="cerror">Bu sayfa için moderatör yetkisi gerekli.</p>;
  if (!reports) return <p className="cmuted">Yükleniyor…</p>;
  if (reports.length === 0) return <p className="cmuted">Açık şikâyet yok. 🎉</p>;

  return (
    <ul className="profile-comments">
      {reports.map((r) => {
        const t: Target = { type: r.target_type, key: r.target_key };
        return (
          <li key={r.id}>
            <div className="chead">
              <span><b>@{r.author_username}</b> — <Link href={targetHref(t)}>{targetLabel(t)}</Link></span>
              <span>{new Date(r.created_at).toLocaleString('tr-TR')}</span>
            </div>
            <p className="cbody">{r.comment_body}</p>
            <p className="cmuted">Bildiren: @{r.reporter_username} — “{r.reason}”</p>
            <div className="cactions">
              <button onClick={() => resolve(r.id, 'hide')}>Yorumu gizle</button>
              <button onClick={() => resolve(r.id, 'dismiss')}>Şikâyeti reddet</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
