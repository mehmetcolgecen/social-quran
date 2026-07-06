// Sosyal API proxy'si — access token httpOnly çerezde kalır, Bearer burada eklenir.
// Prod'da (K3S) API_URL cluster-içi servis adresidir; CORS gerekmez.
import { type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const ALLOWED_ROOTS = new Set(['comments', 'users', 'moderation']);

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path.length || !ALLOWED_ROOTS.has(path[0])) return new Response(null, { status: 404 });

  const session = await getSession();
  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  if (session) headers.authorization = `Bearer ${session.at}`;

  const res = await fetch(`${API_URL}/${path.join('/')}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
  });
  const body = res.status === 204 ? null : await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
