import { NextResponse, type NextRequest } from 'next/server';
import { getDiscovery } from '@/lib/oidc';
import { SESSION_COOKIE } from '@/lib/session';

export async function GET(req: NextRequest) {
  let target = new URL('/', req.nextUrl.origin);
  try {
    const disc = await getDiscovery();
    if (disc.end_session_endpoint) {
      target = new URL(disc.end_session_endpoint);
      target.searchParams.set('post_logout_redirect_uri', `${req.nextUrl.origin}/`);
    }
  } catch { /* issuer kapalıysa yerelde çıkış yeter */ }
  const res = NextResponse.redirect(target);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
