'use client';
// Yorum katmanı: rakam rozetleri (hover'da önizleme), ayetin ALTINDA inline yorum kutusu.
// Ayet kutusu sekmelidir: "Ayet (n)" | "Kelimeler (m)" — kelime yorumları kelime bazında gruplanır.
// Sayfa görünümünde "sayfadaki ayet & kelime yorumları" toplu listesi de vardır.
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { targetLabel, type Target } from '@/lib/target';
import { useSettings } from '@/lib/settings';
import type { ReaderGroup } from '@/lib/types';

type Counts = { surah: number; ayahs: Record<string, number>; words: Record<string, number> };
type Me = { username: string; name: string } | null;
type SlimWord = { p: number; ar: string };
type PanelTarget = Target & { words?: SlimWord[] };

type OwnNote = { id: string; target_type: string; target_key: string; body: string };

type CtxValue = {
  enabled: boolean;
  me: Me;
  counts: Record<number, Counts>;
  pageCount: number | null;
  target: PanelTarget | null;
  myNotes: Map<string, OwnNote[]>; // ayet çapası → kendi yorumların (hâşiye görünümü)
  open: (t: PanelTarget) => void;
  close: () => void;
  refresh: () => void;
};

const Ctx = createContext<CtxValue>({
  enabled: false, me: null, counts: {}, pageCount: null, target: null, myNotes: new Map(),
  open: () => {}, close: () => {}, refresh: () => {},
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
  const [myNotes, setMyNotes] = useState<Map<string, OwnNote[]>>(new Map());

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
    // Kendi yorumların → hâşiye notları (ayet/kelime hedefli olanlar, ayet çapasına gruplu)
    void getJSON<OwnNote[]>('/api/social/users/me/comments').then((rows) => {
      if (!rows) return;
      const m = new Map<string, OwnNote[]>();
      for (const n of rows) {
        if (n.target_type !== 'ayah' && n.target_type !== 'word') continue;
        const anchor = n.target_type === 'ayah' ? n.target_key : n.target_key.split(':').slice(0, 2).join(':');
        if (!m.has(anchor)) m.set(anchor, []);
        m.get(anchor)!.push(n);
      }
      setMyNotes(m);
    });
  }, [surahIds, pageNumber]);

  useEffect(() => {
    if (!enabled) return;
    void getJSON<{ user: Me }>('/api/auth/me').then((r) => setMe(r?.user ?? null));
    refresh();
  }, [enabled, refresh]);

  // Aynı hedefe ikinci tıklama kutuyu kapatır (toggle)
  const open = useCallback((t: PanelTarget) => {
    setTarget((prev) => (prev && prev.type === t.type && prev.key === t.key ? null : t));
  }, []);
  const close = useCallback(() => setTarget(null), []);

  const value = useMemo<CtxValue>(
    () => ({ enabled, me, counts, pageCount, target, myNotes, open, close, refresh }),
    [enabled, me, counts, pageCount, target, myNotes, open, close, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function anchorOf(t: Target): string | null {
  if (t.type === 'ayah') return t.key;
  if (t.type === 'word') return t.key.split(':').slice(0, 2).join(':');
  return null;
}

export function InlineComments({ anchor }: { anchor: string }) {
  const { enabled, target } = useComments();
  if (!enabled || !target || anchorOf(target) !== anchor) return null;
  return <AyahWordBox />;
}

// Hâşiye: kullanıcının kendi yorumları, ayetin altında kesikli okla bağlı
// el yazısı notlar olarak görünür (okumayı bozmayan nostaljik kenar notu).
export function MyNotes({ anchor, words }: { anchor: string; words: SlimWord[] }) {
  const { enabled, me, myNotes, open } = useComments();
  const { settings } = useSettings();
  if (!enabled || !settings.notes || !me) return null;
  const notes = myNotes.get(anchor);
  if (!notes?.length) return null;
  return (
    <div className="mynotes">
      {notes.slice(0, 2).map((n) => (
        <button key={n.id} className="mynote" title="Nota git"
          onClick={() => open(n.target_type === 'word'
            ? { type: 'word', key: n.target_key, words }
            : { type: 'ayah', key: anchor, words })}>
          <svg className="mynote-arrow" viewBox="0 0 44 34" aria-hidden="true">
            <path d="M4 30 C 12 22, 24 14, 38 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeDasharray="5 4" strokeLinecap="round" />
            <path d="M30 4 L39 6 L36 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="mynote-text">
            {n.target_type === 'word' && <em>({n.target_key.split(':')[2]}. kelime)</em>} {n.body.slice(0, 140)}{n.body.length > 140 ? '…' : ''}
          </span>
        </button>
      ))}
      {notes.length > 2 && <span className="cmuted">+{notes.length - 2} notun daha…</span>}
    </div>
  );
}

// ---------- Rozet + hover önizleme ----------
const previewCache = new Map<string, { display_name: string; body: string }[]>();

export function AyahBadge({ surah, ayah, words }: { surah: number; ayah: number; words: SlimWord[] }) {
  const { enabled, counts, open } = useComments();
  const [preview, setPreview] = useState<{ display_name: string; body: string }[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!enabled) return null;
  const c = counts[surah];
  const prefix = `${surah}:${ayah}:`;
  const wordTotal = c ? Object.entries(c.words).reduce((sum, [k, n]) => (k.startsWith(prefix) ? sum + n : sum), 0) : 0;
  const total = (c?.ayahs[String(ayah)] ?? 0) + wordTotal;

  const key = `${surah}:${ayah}`;
  const showPreview = () => {
    if (!total) return;
    timer.current = setTimeout(async () => {
      if (!previewCache.has(key)) {
        const rows = await getJSON<{ display_name: string; body: string }[]>(`/api/social/comments?type=ayah&key=${key}`);
        previewCache.set(key, (rows ?? []).slice(0, 2));
      }
      setPreview(previewCache.get(key) ?? []);
    }, 300);
  };
  const hidePreview = () => {
    if (timer.current) clearTimeout(timer.current);
    setPreview(null);
  };

  return (
    <span className="cbadge-wrap" onMouseEnter={showPreview} onMouseLeave={hidePreview}>
      <button
        className={`cbadge${total ? ' has' : ''}`}
        title={total ? `${total} yorum (ayet + kelime)` : 'Yorum yaz'}
        onClick={() => { hidePreview(); open({ type: 'ayah', key, words }); }}
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

// ---------- Ortak parçalar ----------
type Comment = {
  id: string; target_type: string; target_key: string; body: string;
  visibility: 'public' | 'private'; parent_id: string | null; quote_id: string | null;
  created_at: string; username: string; display_name: string;
  like_count: number; liked: boolean;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function CommentItem({ c, me, quoted, isReply, replies, onChanged, onReply, onQuote }: {
  c: Comment; me: Me; quoted?: Comment; isReply?: boolean; replies?: Comment[];
  onChanged: () => void; onReply?: (c: Comment) => void; onQuote?: (c: Comment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(c.body);
  const [likeState, setLikeState] = useState({ count: c.like_count, liked: c.liked });
  useEffect(() => setLikeState({ count: c.like_count, liked: c.liked }), [c.like_count, c.liked]);

  async function toggleLike() {
    const res = await fetch(`/api/social/comments/${c.id}/like`, { method: likeState.liked ? 'DELETE' : 'POST' });
    if (!res.ok) return;
    const s = (await res.json()) as { likes: number; liked: boolean };
    setLikeState({ count: s.likes, liked: s.liked });
  }
  async function remove() {
    if (!confirm('Yorum silinsin mi?')) return;
    await fetch(`/api/social/comments/${c.id}`, { method: 'DELETE' });
    onChanged();
  }
  async function saveEdit() {
    const res = await fetch(`/api/social/comments/${c.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: editBody }),
    });
    if (res.ok) { setEditing(false); onChanged(); }
  }
  async function report() {
    const reason = prompt('Bu yorumu neden bildiriyorsunuz?');
    if (!reason?.trim()) return;
    const res = await fetch(`/api/social/comments/${c.id}/report`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    alert(res.ok ? 'Bildiriminiz alındı, teşekkürler.' : 'Bildirim gönderilemedi.');
  }

  return (
    <div className={`citem${isReply ? ' reply' : ''}`}>
      <div className="chead">
        <a className="cauthor" href={`/kullanici/${c.username}`}>
          <span className="cavatar">{initials(c.display_name)}</span>
          <b>{c.display_name}</b> <span className="cmuted">@{c.username}</span>
        </a>
        <span className="cmuted">{fmtDate(c.created_at)}{c.visibility === 'private' && ' · 🔒'}</span>
      </div>
      {quoted && <blockquote className="cquote">❝ {quoted.body.slice(0, 160)}</blockquote>}
      {editing ? (
        <div className="cform" style={{ borderTop: 'none', padding: '.3rem 0' }}>
          <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} maxLength={2000} rows={2} />
          <div className="cform-row">
            <button className="csubmit" onClick={saveEdit}>Kaydet</button>
            <button onClick={() => setEditing(false)}>Vazgeç</button>
          </div>
        </div>
      ) : (
        <p className="cbody">{c.body}</p>
      )}
      <div className="cactions">
        <button
          className={`clike${likeState.liked ? ' liked' : ''}`}
          key={`like-${likeState.liked}`}
          disabled={!me || me.username === c.username}
          title={!me ? 'Beğenmek için giriş yapın' : me.username === c.username ? 'Kendi yorumunuz' : likeState.liked ? 'Beğeniyi geri al' : 'Beğen'}
          onClick={toggleLike}
        >
          <span className="heart">{likeState.liked ? '♥' : '♡'}</span> {likeState.count}
        </button>
        {me && !isReply && onReply && <button onClick={() => onReply(c)}>↩ Yanıtla</button>}
        {me && onQuote && <button onClick={() => onQuote(c)}>❝ Alıntıla</button>}
        {me && me.username !== c.username && <button onClick={report}>⚑ Bildir</button>}
        {me?.username === c.username && (
          <>
            <button onClick={() => { setEditBody(c.body); setEditing(true); }}>✎ Düzenle</button>
            <button onClick={remove}>🗑 Sil</button>
          </>
        )}
      </div>
      {replies?.map((r) => (
        <CommentItem key={r.id} c={r} me={me} isReply onChanged={onChanged} onQuote={onQuote} />
      ))}
    </div>
  );
}

function CommentList({ items, me, onChanged, onReply, onQuote }: {
  items: Comment[]; me: Me; onChanged: () => void;
  onReply?: (c: Comment) => void; onQuote?: (c: Comment) => void;
}) {
  const byId = new Map(items.map((c) => [c.id, c]));
  const tops = items.filter((c) => !c.parent_id);
  return (
    <>
      {tops.map((c) => (
        <CommentItem key={c.id} c={c} me={me}
          quoted={c.quote_id ? byId.get(c.quote_id) : undefined}
          replies={items.filter((r) => r.parent_id === c.id)}
          onChanged={onChanged} onReply={onReply} onQuote={onQuote} />
      ))}
    </>
  );
}

function CommentForm({ me, onSubmit, replyTo, quote, onCancelReply, onCancelQuote, extra }: {
  me: Me; onSubmit: (body: string, visibility: 'public' | 'private') => Promise<string | null>;
  replyTo: Comment | null; quote: Comment | null;
  onCancelReply: () => void; onCancelQuote: () => void; extra?: ReactNode;
}) {
  const pathname = usePathname();
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');

  if (!me) {
    return (
      <div className="cform">
        <a className="clogin" href={`/api/auth/login?next=${encodeURIComponent(pathname)}`}>
          Yorum yazmak için giriş yapın →
        </a>
      </div>
    );
  }
  async function submit() {
    setError('');
    const err = await onSubmit(body, visibility);
    if (err) setError(err);
    else setBody('');
  }
  return (
    <div className="cform">
      {replyTo && <div className="cnote">↩ @{replyTo.username} yanıtlanıyor <button onClick={onCancelReply}>vazgeç</button></div>}
      {quote && <div className="cnote">❝ @{quote.username} alıntılanıyor <button onClick={onCancelQuote}>vazgeç</button></div>}
      {extra}
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3}
        placeholder="Yorumunuz… (Ctrl+Enter ile gönder)"
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && body.trim()) void submit(); }}
      />
      <div className="cform-row">
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}>
          <option value="public">🌍 Herkese açık</option>
          <option value="private">🔒 Özel (yalnızca ben)</option>
        </select>
        <span className="cmuted">{body.length}/2000</span>
        <button className="csubmit" disabled={!body.trim()} onClick={submit}>Gönder</button>
      </div>
      {error && <p className="cerror">{error}</p>}
    </div>
  );
}

async function postComment(target: Target, body: string, visibility: string, replyTo: Comment | null, quote: Comment | null): Promise<string | null> {
  const res = await fetch('/api/social/comments', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      target_type: target.type, target_key: target.key, body, visibility,
      parent_id: replyTo ? Number(replyTo.id) : undefined,
      quote_id: quote ? Number(quote.id) : undefined,
    }),
  });
  if (res.ok) return null;
  const err = (await res.json().catch(() => null)) as { message?: string } | null;
  return err?.message ?? 'Yorum gönderilemedi';
}

// ---------- Ayet kutusu: "Ayet | Kelimeler" sekmeleri ----------
function AyahWordBox() {
  const { me, counts, target, close, refresh } = useComments();
  const anchor = anchorOf(target!)!;
  const [s] = anchor.split(':').map(Number);
  const words = target!.words ?? [];

  const [tab, setTab] = useState<'ayet' | 'kelime'>(target!.type === 'word' ? 'kelime' : 'ayet');
  const [writeWord, setWriteWord] = useState<number>(
    target!.type === 'word' ? Number(target!.key.split(':')[2]) : words[0]?.p ?? 1,
  );
  const [ayahItems, setAyahItems] = useState<Comment[] | null>(null);
  const [wordItems, setWordItems] = useState<Map<number, Comment[]> | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [quote, setQuote] = useState<Comment | null>(null);

  useEffect(() => {
    setTab(target!.type === 'word' ? 'kelime' : 'ayet');
    if (target!.type === 'word') setWriteWord(Number(target!.key.split(':')[2]));
    setReplyTo(null); setQuote(null);
    setAyahItems(null); setWordItems(null);
  }, [target]);

  const surahCounts = counts[s];
  const ayahNo = anchor.split(':')[1];
  const wordCountByPos = useMemo(() => {
    const m = new Map<number, number>();
    for (const [k, n] of Object.entries(surahCounts?.words ?? {})) {
      if (k.startsWith(`${anchor}:`)) m.set(Number(k.split(':')[2]), n);
    }
    return m;
  }, [surahCounts, anchor]);
  const ayahCount = surahCounts?.ayahs[ayahNo] ?? 0;
  const wordTotal = [...wordCountByPos.values()].reduce((a, b) => a + b, 0);

  const loadAyah = useCallback(async () => {
    const rows = await getJSON<Comment[]>(`/api/social/comments?type=ayah&key=${anchor}`);
    setAyahItems(rows ?? []);
  }, [anchor]);

  const loadWords = useCallback(async () => {
    const positions = new Set([...wordCountByPos.keys(), writeWord]);
    const entries = await Promise.all([...positions].sort((a, b) => a - b).map(async (p) => {
      const rows = await getJSON<Comment[]>(`/api/social/comments?type=word&key=${anchor}:${p}`);
      return [p, rows ?? []] as const;
    }));
    setWordItems(new Map(entries));
  }, [anchor, wordCountByPos, writeWord]);

  useEffect(() => { if (tab === 'ayet' && !ayahItems) void loadAyah(); }, [tab, ayahItems, loadAyah]);
  useEffect(() => { if (tab === 'kelime' && !wordItems) void loadWords(); }, [tab, wordItems, loadWords]);

  const reload = useCallback(() => {
    setAyahItems(null); setWordItems(null); refresh();
  }, [refresh]);

  async function submit(body: string, visibility: 'public' | 'private') {
    const t: Target = tab === 'ayet'
      ? { type: 'ayah', key: anchor }
      : { type: 'word', key: `${anchor}:${writeWord}` };
    const err = await postComment(t, body, visibility, replyTo, quote);
    if (!err) { setReplyTo(null); setQuote(null); reload(); }
    return err;
  }

  const onReply = (c: Comment) => {
    setReplyTo(c); setQuote(null);
    if (c.target_type === 'word') { setTab('kelime'); setWriteWord(Number(c.target_key.split(':')[2])); }
    else setTab('ayet');
  };
  const onQuote = (c: Comment) => { setQuote(c); setReplyTo(null); };

  const wordAr = (p: number) => words.find((w) => w.p === p)?.ar ?? '';

  return (
    <div className="cbox" dir="ltr">
      <div className="cbox-head">
        <b>💬 {anchor} ayeti</b>
        <span className="cmuted">{ayahCount + wordTotal} yorum</span>
        <button className="cbox-close" onClick={close} title="Kapat">✕</button>
      </div>
      <div className="ctabs">
        <button className={tab === 'ayet' ? 'on' : ''} onClick={() => setTab('ayet')}>Ayet ({ayahCount})</button>
        <button className={tab === 'kelime' ? 'on' : ''} onClick={() => setTab('kelime')}>Kelimeler ({wordTotal})</button>
      </div>
      <div className="clist">
        {tab === 'ayet' && (
          ayahItems === null ? <p className="cmuted">Yükleniyor…</p>
            : ayahItems.length === 0 ? <p className="cmuted">Henüz ayet yorumu yok — ilk yorumu siz yazın.</p>
            : <CommentList items={ayahItems} me={me} onChanged={reload} onReply={onReply} onQuote={onQuote} />
        )}
        {tab === 'kelime' && (
          wordItems === null ? <p className="cmuted">Yükleniyor…</p>
            : [...wordItems.entries()].every(([, v]) => v.length === 0)
              ? <p className="cmuted">Henüz kelime yorumu yok — aşağıdan kelime seçip ilk yorumu yazın.</p>
              : [...wordItems.entries()].filter(([, v]) => v.length > 0).map(([p, items]) => (
                  <div key={p} className="wgroup">
                    <div className="wgroup-head">
                      <span className="wordchip" dir="rtl">{wordAr(p)}</span>
                      <span className="cmuted">{p}. kelime · {items.length} yorum</span>
                    </div>
                    <CommentList items={items} me={me} onChanged={reload} onReply={onReply} onQuote={onQuote} />
                  </div>
                ))
        )}
      </div>
      <CommentForm me={me} onSubmit={submit} replyTo={replyTo} quote={quote}
        onCancelReply={() => setReplyTo(null)} onCancelQuote={() => setQuote(null)}
        extra={tab === 'kelime' ? (
          <div className="cnote">
            Hedef kelime:{' '}
            <select value={writeWord} onChange={(e) => { setWriteWord(Number(e.target.value)); setWordItems(null); }}>
              {words.map((w) => (
                <option key={w.p} value={w.p}>{w.p}. — {w.ar}{wordCountByPos.get(w.p) ? ` (${wordCountByPos.get(w.p)})` : ''}</option>
              ))}
            </select>
          </div>
        ) : undefined}
      />
    </div>
  );
}

// ---------- Sure/sayfa hedef kutusu (tek liste) ----------
function SingleTargetBox() {
  const { me, target, close, refresh } = useComments();
  const t: Target = { type: target!.type, key: target!.key };
  const [items, setItems] = useState<Comment[] | null>(null);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [quote, setQuote] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    const rows = await getJSON<Comment[]>(`/api/social/comments?type=${t.type}&key=${t.key}`);
    setItems(rows ?? []);
  }, [t.type, t.key]);
  useEffect(() => { void load(); }, [load]);

  const reload = useCallback(() => { void load(); refresh(); }, [load, refresh]);
  async function submit(body: string, visibility: 'public' | 'private') {
    const err = await postComment(t, body, visibility, replyTo, quote);
    if (!err) { setReplyTo(null); setQuote(null); reload(); }
    return err;
  }

  return (
    <div className="cbox" dir="ltr">
      <div className="cbox-head">
        <b>💬 {targetLabel(t)}</b>
        <span className="cmuted">{items?.length ?? 0} yorum</span>
        <button className="cbox-close" onClick={close} title="Kapat">✕</button>
      </div>
      <div className="clist">
        {items === null ? <p className="cmuted">Yükleniyor…</p>
          : items.length === 0 ? <p className="cmuted">Henüz yorum yok — ilk yorumu siz yazın.</p>
          : <CommentList items={items} me={me} onChanged={reload}
              onReply={(c) => { setReplyTo(c); setQuote(null); }}
              onQuote={(c) => { setQuote(c); setReplyTo(null); }} />}
      </div>
      <CommentForm me={me} onSubmit={submit} replyTo={replyTo} quote={quote}
        onCancelReply={() => setReplyTo(null)} onCancelQuote={() => setQuote(null)} />
    </div>
  );
}

// ---------- Sayfadaki tüm ayet & kelime yorumları (toplu, salt-okunur özet) ----------
function PageAllComments({ groups, onClose }: { groups: ReaderGroup[]; onClose: () => void }) {
  const { me, counts, open } = useComments();
  const [data, setData] = useState<{ label: string; anchor: string; items: Comment[]; words: SlimWord[]; surah: number }[] | null>(null);

  useEffect(() => {
    (async () => {
      const sections: { label: string; anchor: string; items: Comment[]; words: SlimWord[]; surah: number }[] = [];
      for (const g of groups) {
        const c = counts[g.surah.id];
        if (!c) continue;
        for (const ayah of g.ayahs) {
          const key = `${g.surah.id}:${ayah.ayah}`;
          const wordKeys = Object.keys(c.words).filter((k) => k.startsWith(`${key}:`));
          const items: Comment[] = [];
          if (c.ayahs[String(ayah.ayah)]) {
            items.push(...((await getJSON<Comment[]>(`/api/social/comments?type=ayah&key=${key}`)) ?? []));
          }
          for (const wk of wordKeys) {
            items.push(...((await getJSON<Comment[]>(`/api/social/comments?type=word&key=${wk}`)) ?? []));
          }
          if (items.length) {
            sections.push({
              label: `${key}`, anchor: `ayet-${g.surah.id}-${ayah.ayah}`, items,
              words: ayah.words.map((w) => ({ p: w.p, ar: w.ar })), surah: g.surah.id,
            });
          }
        }
      }
      setData(sections);
    })();
  }, [groups, counts]);

  return (
    <div className="cbox" dir="ltr">
      <div className="cbox-head">
        <b>💬 Sayfadaki ayet &amp; kelime yorumları</b>
        <button className="cbox-close" onClick={onClose} title="Kapat">✕</button>
      </div>
      <div className="clist">
        {data === null ? <p className="cmuted">Yükleniyor…</p>
          : data.length === 0 ? <p className="cmuted">Bu sayfadaki ayetlerde henüz yorum yok.</p>
          : data.map((sec) => (
            <div key={sec.label} className="wgroup">
              <div className="wgroup-head">
                <a href={`#${sec.anchor}`}>{sec.label}</a>
                <button className="cmuted" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => open({ type: 'ayah', key: sec.label, words: sec.words })}>
                  yorum yaz →
                </button>
              </div>
              {sec.items.map((c) => (
                <div key={`${c.target_type}-${c.id}`} className="citem">
                  <div className="chead">
                    <a className="cauthor" href={`/kullanici/${c.username}`}>
                      <span className="cavatar">{initials(c.display_name)}</span>
                      <b>{c.display_name}</b>
                    </a>
                    <span className="cmuted">
                      {c.target_type === 'word' ? `${c.target_key.split(':')[2]}. kelime` : 'ayet'} · {fmtDate(c.created_at)}
                    </span>
                  </div>
                  <p className="cbody">{c.body}</p>
                  <div className="cactions"><span className="cmuted">♥ {c.like_count}</span></div>
                </div>
              ))}
            </div>
          ))}
      </div>
      {!me && <div className="cform"><span className="cmuted" style={{ display: 'block', textAlign: 'center' }}>Yorum yazmak için giriş yapın</span></div>}
    </div>
  );
}

// ---------- Hedef düğmeleri ----------
export function TargetButtons({ groups, pageNumber }: { groups: ReaderGroup[]; pageNumber?: number }) {
  const { enabled, counts, pageCount, target, open } = useComments();
  const [showAll, setShowAll] = useState(false);
  if (!enabled) return null;
  const boxHere = target && (target.type === 'surah' || target.type === 'page');

  // Sayfadaki ayet+kelime yorumlarının toplamı
  let inPageTotal = 0;
  if (pageNumber) {
    for (const g of groups) {
      const c = counts[g.surah.id];
      if (!c) continue;
      for (const ayah of g.ayahs) {
        inPageTotal += c.ayahs[String(ayah.ayah)] ?? 0;
        const prefix = `${g.surah.id}:${ayah.ayah}:`;
        for (const [k, n] of Object.entries(c.words)) if (k.startsWith(prefix)) inPageTotal += n;
      }
    }
  }

  return (
    <>
      <div className="target-buttons">
        {groups.map((g) => (
          <button key={g.surah.id} onClick={() => { setShowAll(false); open({ type: 'surah', key: String(g.surah.id) }); }}>
            💬 {g.surah.name_tr} Suresi yorumları ({counts[g.surah.id]?.surah ?? 0})
          </button>
        ))}
        {pageNumber && (
          <>
            <button onClick={() => { setShowAll(false); open({ type: 'page', key: String(pageNumber) }); }}>
              💬 Sayfa {pageNumber} yorumları ({pageCount ?? 0})
            </button>
            <button onClick={() => setShowAll((v) => !v)}>
              💬 Sayfadaki ayet &amp; kelime yorumları ({inPageTotal})
            </button>
          </>
        )}
      </div>
      {boxHere && !showAll && <SingleTargetBox />}
      {showAll && <PageAllComments groups={groups} onClose={() => setShowAll(false)} />}
    </>
  );
}
