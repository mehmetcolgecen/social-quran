import { createHash, randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { OIDC, getDiscovery, requestOrigin } from '@/lib/oidc';

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  const next = req.nextUrl.searchParams.get('next') ?? '/';
  // Kimlik sunucusuna ulaşılamıyorsa 500 yerine ana sayfaya anlaşılır hatayla dön
  let disc;
  try {
    disc = await getDiscovery();
  } catch {
    return NextResponse.redirect(new URL('/?hata=kimlik', origin));
  }
  const state = randomBytes(16).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const url = new URL(disc.authorization_endpoint);
  url.searchParams.set('client_id', OIDC.clientId);
  url.searchParams.set('redirect_uri', `${origin}/api/auth/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid profile');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  const res = NextResponse.redirect(url);
  res.cookies.set('sk_auth', JSON.stringify({ state, verifier, next }), {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600,
  });
  return res;
}
