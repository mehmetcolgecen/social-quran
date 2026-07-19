import { NextResponse, type NextRequest } from 'next/server';
import { OIDC, getDiscovery, requestOrigin } from '@/lib/oidc';
import { SESSION_COOKIE } from '@/lib/session';

export async function GET(req: NextRequest) {
  const origin = requestOrigin(req);
  let target = new URL('/', origin);
  try {
    const disc = await getDiscovery(origin);
    if (disc.end_session_endpoint) {
      target = new URL(disc.end_session_endpoint);
      target.searchParams.set('post_logout_redirect_uri', `${origin}/`);
      // Keycloak, redirect'li çıkışta id_token_hint ister; yoksa client_id ile
      // onay ekranına düşer (eski oturumlardan kalan çerezsiz durum için yedek).
      const idt = req.cookies.get('sk_idt')?.value;
      if (idt) target.searchParams.set('id_token_hint', idt);
      else target.searchParams.set('client_id', OIDC.clientId);
    }
  } catch { /* issuer kapalıysa yerelde çıkış yeter */ }
  const res = NextResponse.redirect(target);
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete('sk_idt');
  return res;
}
