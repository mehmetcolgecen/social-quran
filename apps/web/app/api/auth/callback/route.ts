import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode, requestOrigin, verifyIdToken } from '@/lib/oidc';
import { SESSION_COOKIE, sealSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const authCookie = req.cookies.get('sk_auth')?.value;
  if (!code || !state || !authCookie) {
    return NextResponse.redirect(new URL('/?hata=giris', origin));
  }
  let saved: { state: string; verifier: string; next: string };
  try { saved = JSON.parse(authCookie); } catch { return NextResponse.redirect(new URL('/?hata=giris', origin)); }
  if (saved.state !== state) return NextResponse.redirect(new URL('/?hata=state', origin));

  try {
    const tokens = await exchangeCode(code, saved.verifier, `${origin}/api/auth/callback`);
    const claims = await verifyIdToken(tokens.id_token);
    const maxAge = Math.max(60, (tokens.expires_in ?? 3600) - 30);
    const sealed = await sealSession({ ...claims, at: tokens.access_token }, maxAge);
    // Yalnızca site-içi göreli yola dön (open redirect engeli)
    const nextPath = saved.next.startsWith('/') && !saved.next.startsWith('//') ? saved.next : '/';
    const res = NextResponse.redirect(new URL(nextPath, origin));
    res.cookies.set(SESSION_COOKIE, sealed, {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge,
      secure: origin.startsWith('https:'),
    });
    res.cookies.delete('sk_auth');
    return res;
  } catch {
    return NextResponse.redirect(new URL('/?hata=token', origin));
  }
}
