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
  // "{origin}" yer tutucusu istek origin'iyle değiştirilir: her domain (sosyal-kuran.com /
  // social-quran.com) KENDİ /auth adresini kullanır; Keycloak tarafında hostname dinamiktir
  // (KC_HOSTNAME_STRICT=false). Dev'de sabit mock issuer.
  issuer: process.env.OIDC_ISSUER ?? 'http://localhost:7788',
  clientId: process.env.OIDC_CLIENT_ID ?? 'sosyal-kuran-web',
  clientSecret: process.env.OIDC_CLIENT_SECRET, // Keycloak confidential client için
};

export const issuerFor = (origin: string) => OIDC.issuer.replace('{origin}', origin);

type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
};

const discoveryCache = new Map<string, Discovery>();
const jwksCache = new Map<string, JWTVerifyGetKey>();

export async function getDiscovery(origin = ''): Promise<Discovery> {
  const iss = issuerFor(origin);
  let d = discoveryCache.get(iss);
  if (!d) {
    const res = await fetch(`${iss}/.well-known/openid-configuration`);
    if (!res.ok) throw new Error(`OIDC discovery başarısız: ${res.status}`);
    d = (await res.json()) as Discovery;
    discoveryCache.set(iss, d);
  }
  return d;
}

export async function exchangeCode(code: string, verifier: string, redirectUri: string, origin = '') {
  const disc = await getDiscovery(origin);
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

export async function verifyIdToken(idToken: string, origin = '') {
  const disc = await getDiscovery(origin);
  let jwks = jwksCache.get(disc.jwks_uri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(disc.jwks_uri));
    jwksCache.set(disc.jwks_uri, jwks);
  }
  const { payload } = await jwtVerify(idToken, jwks, { issuer: disc.issuer, audience: OIDC.clientId });
  return {
    sub: String(payload.sub),
    username: String(payload.preferred_username ?? payload.sub),
    name: String(payload.name ?? payload.preferred_username ?? ''),
  };
}
