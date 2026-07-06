import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode, verifyIdToken } from '@/lib/oidc';
import { SESSION_COOKIE, sealSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const authCookie = req.cookies.get('sk_auth')?.value;
  if (!code || !state || !authCookie) {
    return NextResponse.redirect(new URL('/?hata=giris', req.nextUrl.origin));
  }
  let saved: { state: string; verifier: string; next: string };
  try { saved = JSON.parse(authCookie); } catch { return NextResponse.redirect(new URL('/?hata=giris', req.nextUrl.origin)); }
  if (saved.state !== state) return NextResponse.redirect(new URL('/?hata=state', req.nextUrl.origin));

  try {
    const tokens = await exchangeCode(code, saved.verifier, `${req.nextUrl.origin}/api/auth/callback`);
    const claims = await verifyIdToken(tokens.id_token);
    const maxAge = Math.max(60, (tokens.expires_in ?? 3600) - 30);
    const sealed = await sealSession({ ...claims, at: tokens.access_token }, maxAge);
    // Yalnızca site-içi göreli yola dön (open redirect engeli)
    const nextPath = saved.next.startsWith('/') && !saved.next.startsWith('//') ? saved.next : '/';
    const res = NextResponse.redirect(new URL(nextPath, req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE, sealed, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge,
      secure: req.nextUrl.protocol === 'https:',
    });
    res.cookies.delete('sk_auth');
    return res;
  } catch {
    return NextResponse.redirect(new URL('/?hata=token', req.nextUrl.origin));
  }
}
