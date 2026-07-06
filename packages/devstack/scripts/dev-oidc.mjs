// Keycloak-uyumlu minimal OIDC dev issuer — YALNIZCA yerel geliştirme için.
// Standart uçlar: discovery, authorize (code + PKCE S256), token, jwks.
// Prod'da OIDC_ISSUER bir Keycloak realm'ine çevrilir; API/web kodu değişmez.
// Çalıştır: npm run -w packages/devstack oidc
import { createServer } from 'node:http';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SignJWT, exportJWK, generateKeyPair, importJWK } from 'jose';

const PORT = 7788;
const ISSUER = process.env.DEV_OIDC_ISSUER ?? `http://localhost:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const KEY_FILE = path.join(ROOT, 'data/.dev/oidc-key.json');

// Anahtar kalıcıdır ki API'nin JWKS önbelleği restart'lar arasında geçerli kalsın
mkdirSync(path.dirname(KEY_FILE), { recursive: true });
let privateJwk;
if (existsSync(KEY_FILE)) {
  privateJwk = JSON.parse(readFileSync(KEY_FILE, 'utf8'));
} else {
  const { privateKey } = await generateKeyPair('RS256', { extractable: true });
  privateJwk = { ...(await exportJWK(privateKey)), kid: 'dev-1', alg: 'RS256', use: 'sig' };
  writeFileSync(KEY_FILE, JSON.stringify(privateJwk));
}
const privateKey = await importJWK(privateJwk, 'RS256');
const publicJwk = { kty: privateJwk.kty, n: privateJwk.n, e: privateJwk.e, kid: privateJwk.kid, alg: 'RS256', use: 'sig' };

const codes = new Map(); // code -> { sub, username, name, challenge, redirect_uri, exp }
const subFor = (username) => {
  const h = createHash('sha256').update(`sk-dev:${username}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

async function issueTokens(entry) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: entry.sub, preferred_username: entry.username, name: entry.name,
    // Keycloak realm rol formatı — API aynı claim'i prod'da da okur
    ...(entry.role && entry.role !== 'user' ? { realm_access: { roles: [entry.role] } } : {}),
  };
  const sign = (extra) => new SignJWT({ ...claims, ...extra })
    .setProtectedHeader({ alg: 'RS256', kid: privateJwk.kid })
    .setIssuer(ISSUER).setIssuedAt(now).setExpirationTime(now + 3600)
    .sign(privateKey);
  return {
    access_token: await sign({ aud: 'sosyal-kuran-api', typ: 'Bearer' }),
    id_token: await sign({ aud: 'sosyal-kuran-web' }),
    token_type: 'Bearer',
    expires_in: 3600,
  };
}

const LOGIN_FORM = (q) => `<!doctype html><html lang="tr"><meta charset="utf-8">
<title>Dev Girişi</title>
<body style="font-family:sans-serif;max-width:22rem;margin:4rem auto">
<h3>Sosyal Kur'an — Dev Girişi</h3>
<p style="color:#a00;font-size:.8rem">Yalnızca yerel geliştirme. Prod'da burası Keycloak olur.</p>
<form method="post" action="/authorize?${q}">
  <label>Kullanıcı adı<br><input name="username" required pattern="[a-zA-Z0-9_]{3,30}" style="width:100%"></label><br><br>
  <label>Görünen ad<br><input name="name" style="width:100%"></label><br><br>
  <label>Rol (yalnızca dev)<br><select name="role" style="width:100%">
    <option value="user">Kullanıcı</option>
    <option value="moderator">Moderatör</option>
    <option value="admin">Admin</option>
  </select></label><br><br>
  <button style="width:100%">Giriş yap</button>
</form></body></html>`;

createServer(async (req, res) => {
  const url = new URL(req.url, ISSUER);
  const send = (status, body, type = 'application/json') => {
    res.writeHead(status, { 'content-type': `${type}; charset=utf-8` });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  if (url.pathname === '/.well-known/openid-configuration') {
    return send(200, {
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/jwks`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      id_token_signing_alg_values_supported: ['RS256'],
      end_session_endpoint: `${ISSUER}/logout`,
    });
  }
  if (url.pathname === '/jwks') return send(200, { keys: [publicJwk] });

  if (url.pathname === '/authorize') {
    const p = url.searchParams;
    let username = p.get('username'); // headless (e2e) kısayolu
    let name = p.get('name') ?? '';
    let role = p.get('role') ?? 'user';
    if (req.method === 'POST') {
      const body = await new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
      const form = new URLSearchParams(body);
      username = form.get('username');
      name = form.get('name') ?? '';
      role = form.get('role') ?? 'user';
    }
    if (!['user', 'moderator', 'admin'].includes(role)) role = 'user';
    if (!username) return send(200, LOGIN_FORM(p.toString()), 'text/html');
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return send(400, { error: 'geçersiz kullanıcı adı' });
    const code = randomBytes(24).toString('base64url');
    codes.set(code, {
      sub: subFor(username), username, name: name || username, role,
      challenge: p.get('code_challenge'), redirect_uri: p.get('redirect_uri'),
      exp: Date.now() + 120_000,
    });
    const target = new URL(p.get('redirect_uri'));
    target.searchParams.set('code', code);
    if (p.get('state')) target.searchParams.set('state', p.get('state'));
    res.writeHead(302, { location: target.href });
    return res.end();
  }

  if (url.pathname === '/token' && req.method === 'POST') {
    const body = await new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
    const form = new URLSearchParams(body);
    const entry = codes.get(form.get('code'));
    codes.delete(form.get('code'));
    if (!entry || entry.exp < Date.now()) return send(400, { error: 'invalid_grant' });
    if (form.get('grant_type') !== 'authorization_code') return send(400, { error: 'unsupported_grant_type' });
    if (entry.redirect_uri !== form.get('redirect_uri')) return send(400, { error: 'invalid_grant' });
    const digest = createHash('sha256').update(form.get('code_verifier') ?? '').digest('base64url');
    if (entry.challenge !== digest) return send(400, { error: 'invalid_grant', error_description: 'PKCE' });
    return send(200, await issueTokens(entry));
  }

  if (url.pathname === '/logout') {
    const target = url.searchParams.get('post_logout_redirect_uri') ?? 'http://localhost:3000/';
    res.writeHead(302, { location: target });
    return res.end();
  }

  send(404, { error: 'not_found' });
}).listen(PORT, () => console.log(`Dev OIDC issuer hazır: ${ISSUER} (uuid örneği: ${randomUUID().slice(0, 8)}…)`));
