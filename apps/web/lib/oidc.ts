// OIDC istemci yardımcıları (sunucu tarafı) — standart discovery + code flow (PKCE).
// Dev'de issuer packages/devstack mock'u; prod'da OIDC_ISSUER bir Keycloak realm URL'i olur.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { NextRequest } from 'next/server';

// Proxy (Traefik) arkasında nextUrl.origin bind adresini görür (https://0.0.0.0:3000);
// mutlak URL'ler x-forwarded-* başlıklarından türetilmeli ki redirect_uri kullanıcının
// bulunduğu domain'e (sosyal-kuran.com veya social-quran.com) dönsün. Ingress yalnızca
// tanımlı Host'ları yönlendirdiği için başlığa güvenmek burada güvenlidir.
export function requestOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  return host ? `${proto}://${host}` : req.nextUrl.origin;
}

export const OIDC = {
  issuer: process.env.OIDC_ISSUER ?? 'http://localhost:7788',
  clientId: process.env.OIDC_CLIENT_ID ?? 'sosyal-kuran-web',
  clientSecret: process.env.OIDC_CLIENT_SECRET, // Keycloak confidential client için
};

type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
};

let discovery: Discovery | null = null;
let jwks: JWTVerifyGetKey | null = null;

export async function getDiscovery(): Promise<Discovery> {
  if (!discovery) {
    const res = await fetch(`${OIDC.issuer}/.well-known/openid-configuration`);
    if (!res.ok) throw new Error(`OIDC discovery başarısız: ${res.status}`);
    discovery = (await res.json()) as Discovery;
  }
  return discovery;
}

export async function exchangeCode(code: string, verifier: string, redirectUri: string) {
  const disc = await getDiscovery();
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
    client_id: OIDC.clientId,
  });
  if (OIDC.clientSecret) params.set('client_secret', OIDC.clientSecret);
  const res = await fetch(disc.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) throw new Error(`Token değişimi başarısız: ${res.status}`);
  return (await res.json()) as { access_token: string; id_token: string; expires_in: number };
}

export async function verifyIdToken(idToken: string) {
  const disc = await getDiscovery();
  jwks ??= createRemoteJWKSet(new URL(disc.jwks_uri));
  const { payload } = await jwtVerify(idToken, jwks, { issuer: disc.issuer, audience: OIDC.clientId });
  return {
    sub: String(payload.sub),
    username: String(payload.preferred_username ?? payload.sub),
    name: String(payload.name ?? payload.preferred_username ?? ''),
  };
}
