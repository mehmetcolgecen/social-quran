'use client';
// Yorum katmanı: rakam rozetleri (hover'da belirginleşir, ayarlardan kapatılabilir),
// sağ panel (kelime/ayet/sayfa/sure hedefleri), public/private, yanıt + alıntı.
// Misafir okur; yazmak için giriş gerekir.
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { targetLabel, type Target } from '@/lib/target';
import type { ReaderGroup } from '@/lib/types';

type Counts = { surah: number; ayahs: Record<string, number>; words: Record<string, number> };
type Me = { username: string; name: string } | null;
type PanelTarget = Target & { words?: { p: number; ar: string }[] };

type CtxValue = {
  enabled: boolean;
  me: Me;
  counts: Record<number, Counts>;
  pageCount: number | null;
  open: (t: PanelTarget) => void;
  refresh: () => void;
};

const Ctx = createContext<CtxValue>({
  enabled: false, me: null, counts: {}, pageCount: null, open: () => {}, refresh: () => {},
});
export const useComments = () => useContext(Ctx);

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}

export function CommentsProvider({ groups, pageNumber, enabled, children }: {
  groups: ReaderGroup[]; pageNumber?: number; enabled: boolean; children: ReactNode;
}) {
  const [me, setMe] = useState<Me>(null);
  const [counts, setCounts] = useState<Record<number, Counts>>({});
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [target, setTarget] = useState<PanelTarget | null>(null);

  const surahIds = useMemo(() => groups.map((g) => g.surah.id), [groups]);

  const refresh = useCallback(() => {
    for (const id of surahIds) {
      void getJSON<Counts>(`/api/social/comments/counts?surah=${id}`).then((c) => {
        if (c) setCounts((prev) => ({ ...prev, [id]: c }));
      });
    }
    if (pageNumber) {
      void getJSON<{ page: number }>(`/api/social/comments/counts?page=${pageNumber}`).then((c) => {
        if (c) setPageCount(c.page);
      });
    }
  }, [surahIds, pageNumber]);

  useEffect(() => {
    if (!enabled) return;
    void getJSON<{ user: Me }>('/api/auth/me').then((r) => setMe(r?.user ?? null));
    refresh();
  }, [enabled, refresh]);

  const value = useMemo<CtxValue>(
    () => ({ enabled, me, counts, pageCount, open: setTarget, refresh }),
    [enabled, me, counts, pageCount, refresh],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {enabled && target && <Panel target={target} onClose={() => setTarget(null)} />}
    </Ctx.Provider>
  );
}

// Ayet rozeti: ayet + o ayetin kelime yorumlarının toplamı; 0 ise soluk "+".
// Hover'da ilk yorumların kısa önizlemesi gösterilir (GOAL: rakam + hover belirginleşme).
const previewCache = new Map<string, { display_name: string; body: string }[]>();

export function AyahBadge({ surah, ayah, words }: {
  surah: number; ayah: number; words: { p: number; ar: string }[];
}) {
  const { enabled, counts, open } = useComments();
  const [preview, setPreview] = useState<{ display_name: string; body: string }[] | null>(null);
  const timer = useState<{ id: ReturnType<typeof setTimeout> | null }>({ id: null })[0];
  if (!enabled) return null;
  const c = counts[surah];
  const prefix = `${surah}:${ayah}:`;
  const wordTotal = c ? Object.entries(c.words).reduce((sum, [k, n]) => (k.startsWith(prefix) ? sum + n : sum), 0) : 0;
  const total = (c?.ayahs[String(ayah)] ?? 0) + wordTotal;

  const key = `${surah}:${ayah}`;
  const showPreview = () => {
    if (!total) return;
    timer.id = setTimeout(async () => {
      if (!previewCache.has(key)) {
        const rows = await getJSON<{ display_name: string; body: string }[]>(`/api/social/comments?type=ayah&key=${key}`);
        previewCache.set(key, (rows ?? []).slice(0, 2));
      }
      setPreview(previewCache.get(key) ?? []);
    }, 300);
  };
  const hidePreview = () => {
    if (timer.id) clearTimeout(timer.id);
    setPreview(null);
  };

  return (
    <span className="cbadge-wrap" onMouseEnter={showPreview} onMouseLeave={hidePreview}>
      <button
        className={`cbadge${total ? ' has' : ''}`}
        title={total ? `${total} yorum` : 'Yorum yaz'}
        onClick={() => open({ type: 'ayah', key, words })}
      >
        {total || '+'}
      </button>
      {preview && preview.length > 0 && (
        <span className="cpreview">
          {preview.map((p, i) => (
            <span key={i}><b>{p.display_name}:</b> {p.body.slice(0, 70)}{p.body.length > 70 ? '…' : ''}</span>
          ))}
          {total > preview.length && <span className="cmuted">+{total - preview.length} yorum daha…</span>}
        </span>
      )}
    </span>
  );
}

// Sure/sayfa hedef düğmeleri (okuyucunun üstünde)
export function TargetButtons({ groups, pageNumber }: { groups: ReaderGroup[]; pageNumber?: number }) {
  const { enabled, counts, pageCount, open } = useComments();
  if (!enabled) return null;
  return (
    <div className="target-buttons">
      {groups.map((g) => (
        <button key={g.surah.id} onClick={() => open({ type: 'surah', key: String(g.surah.id) })}>
          💬 {g.surah.name_tr} Suresi yorumları ({counts[g.surah.id]?.surah ?? 0})
        </button>
      ))}
      {pageNumber && (
        <button onClick={() => open({ type: 'page', key: String(pageNumber) })}>
          💬 Sayfa {pageNumber} yorumları ({pageCount ?? 0})
        </button>
      )}
    </div>
  );
}

type Comment = {
  id: string; target_type: string; target_key: string; body: string;
  visibility: 'public' | 'private'; parent_id: string | null; quote_id: string | null;
  created_at: string; username: string; display_name: string;
  like_count: number; liked: boolean;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

function Panel({ target, onClose }: { target: PanelTarget; onClose: () => void }) {
  const { me, refresh } = useComments();
  const pathname = usePathname();
  const [current, setCurrent] = useState<Target>({ type: target.type, key: target.key });
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [quote, setQuote] = useState<Comment | null>(null);
  const [editing, setEditing] = useState<Comment | null>(null);

  useEffect(() => { setCurrent({ type: target.type, key: target.key }); }, [target]);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getJSON<Comment[]>(`/api/social/comments?type=${current.type}&key=${current.key}`);
    setItems(rows ?? []);
    setLoading(false);
  }, [current]);

  useEffect(() => { void load(); }, [load]);

  async function submit() {
    setError('');
    const payload: Record<string, unknown> = editing
      ? { body, visibility }
      : {
          target_type: current.type, target_key: current.key, body, visibility,
          parent_id: replyTo ? Number(replyTo.id) : undefined,
          quote_id: quote ? Number(quote.id) : undefined,
        };
    const res = await fetch(editing ? `/api/social/comments/${editing.id}` : '/api/social/comments', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(err?.message ?? 'Yorum gönderilemedi');
      return;
    }
    setBody(''); setReplyTo(null); setQuote(null); setEditing(null);
    await load();
    refresh();
  }

  async function remove(c: Comment) {
    if (!confirm('Yorum silinsin mi?')) return;
    await fetch(`/api/social/comments/${c.id}`, { method: 'DELETE' });
    await load();
    refresh();
  }

  async function toggleLike(c: Comment) {
    const res = await fetch(`/api/social/comments/${c.id}/like`, { method: c.liked ? 'DELETE' : 'POST' });
    if (!res.ok) return;
    const state = (await res.json()) as { likes: number; liked: boolean };
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, like_count: state.likes, liked: state.liked } : x)));
  }

  async function report(c: Comment) {
    const reason = prompt('Bu yorumu neden bildiriyorsunuz?');
    if (!reason?.trim()) return;
    const res = await fetch(`/api/social/comments/${c.id}/report`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    alert(res.ok ? 'Bildiriminiz alındı, teşekkürler.' : 'Bildirim gönderilemedi.');
  }

  const tops = items.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => items.filter((c) => c.parent_id === id);
  const byId = new Map(items.map((c) => [c.id, c]));

  const renderItem = (c: Comment, isReply = false) => (
    <div key={c.id} className={`citem${isReply ? ' reply' : ''}`}>
      <div className="chead">
        <a href={`/kullanici/${c.username}`}><b>{c.display_name}</b> @{c.username}</a>
        <span>{fmtDate(c.created_at)}{c.visibility === 'private' && ' · 🔒 özel'}</span>
      </div>
      {c.quote_id && byId.get(c.quote_id) && (
        <blockquote className="cquote">{byId.get(c.quote_id)!.body.slice(0, 160)}</blockquote>
      )}
      <p className="cbody">{c.body}</p>
      <div className="cactions">
        <button
          className={`clike${c.liked ? ' liked' : ''}`}
          disabled={!me || me.username === c.username}
          title={!me ? 'Beğenmek için giriş yapın' : me.username === c.username ? 'Kendi yorumunuz' : c.liked ? 'Beğeniyi geri al' : 'Beğen'}
          onClick={() => toggleLike(c)}
        >
          {c.liked ? '♥' : '♡'} {c.like_count}
        </button>
        {me && !isReply && <button onClick={() => { setReplyTo(c); setQuote(null); setEditing(null); }}>Yanıtla</button>}
        {me && <button onClick={() => { setQuote(c); setReplyTo(null); setEditing(null); }}>Alıntıla</button>}
        {me && me.username !== c.username && <button onClick={() => report(c)}>Bildir</button>}
        {me?.username === c.username && (
          <>
            <button onClick={() => { setEditing(c); setBody(c.body); setVisibility(c.visibility); setReplyTo(null); setQuote(null); }}>Düzenle</button>
            <button onClick={() => remove(c)}>Sil</button>
          </>
        )}
      </div>
      {!isReply && repliesOf(c.id).map((r) => renderItem(r, true))}
    </div>
  );

  return (
    <aside className="cpanel">
      <div className="cpanel-head">
        <b>{targetLabel(current)}</b>
        <button onClick={onClose} title="Kapat">✕</button>
      </div>
      {target.type === 'ayah' && target.words && (
        <select
          className="cword-select"
          value={current.type === 'word' ? current.key : ''}
          onChange={(e) => setCurrent(e.target.value
            ? { type: 'word', key: e.target.value }
            : { type: 'ayah', key: target.key })}
        >
          <option value="">Ayetin tamamı</option>
          {target.words.map((w) => (
            <option key={w.p} value={`${target.key}:${w.p}`}>{w.p}. kelime — {w.ar}</option>
          ))}
        </select>
      )}
      <div className="clist">
        {loading ? <p className="cmuted">Yükleniyor…</p>
          : tops.length === 0 ? <p className="cmuted">Henüz yorum yok.</p>
          : tops.map((c) => renderItem(c))}
      </div>
      {me ? (
        <div className="cform">
          {replyTo && <div className="cnote">↩ @{replyTo.username} yanıtlanıyor <button onClick={() => setReplyTo(null)}>vazgeç</button></div>}
          {quote && <div className="cnote">❝ @{quote.username} alıntılanıyor <button onClick={() => setQuote(null)}>vazgeç</button></div>}
          {editing && <div className="cnote">✎ yorum düzenleniyor <button onClick={() => { setEditing(null); setBody(''); }}>vazgeç</button></div>}
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000}
            placeholder="Yorumunuz… (saygı çerçevesinde)" rows={3} />
          <div className="cform-row">
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}>
              <option value="public">Herkese açık</option>
              <option value="private">Özel (yalnızca ben)</option>
            </select>
            <button disabled={!body.trim()} onClick={submit}>{editing ? 'Kaydet' : 'Gönder'}</button>
          </div>
          {error && <p className="cerror">{error}</p>}
        </div>
      ) : (
        <div className="cform">
          <a className="clogin" href={`/api/auth/login?next=${encodeURIComponent(pathname)}`}>
            Yorum yazmak için giriş yapın →
          </a>
        </div>
      )}
    </aside>
  );
}
