// Faz 2 kabul kriteri e2e testi: "misafir okur/yazamaz, üye yazar".
// Gerektirir: dev PG (5433), dev OIDC (7788), API (4000) çalışır durumda.
// Çalıştır: npm run -w apps/api test:e2e
import { createHash, randomBytes } from 'node:crypto';

const API = process.env.API_URL ?? 'http://localhost:4000';
const OIDC = process.env.OIDC_ISSUER ?? 'http://localhost:7788';

let passed = 0, failed = 0;
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name} ${detail}`); }
}

async function login(username) {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const redirect = 'http://localhost:9999/cb';
  const auth = await fetch(`${OIDC}/authorize?username=${username}&redirect_uri=${encodeURIComponent(redirect)}` +
    `&code_challenge=${challenge}&code_challenge_method=S256&state=x`, { redirect: 'manual' });
  const code = new URL(auth.headers.get('location')).searchParams.get('code');
  const res = await fetch(`${OIDC}/token`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirect, client_id: 'sosyal-kuran-web' }),
  });
  return (await res.json()).access_token;
}

const json = (method, path, token, body) => fetch(`${API}${path}`, {
  method,
  headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

const suffix = randomBytes(3).toString('hex');
const [ali, veli] = await Promise.all([login(`e2e_ali_${suffix}`), login(`e2e_veli_${suffix}`)]);

console.log('Misafir:');
check('sağlık', (await fetch(`${API}/health`)).ok);
check('sayımları okur', (await fetch(`${API}/comments/counts?surah=2`)).ok);
check('yorumları okur', (await fetch(`${API}/comments?type=ayah&key=2:255`)).ok);
check('yorum YAZAMAZ (401)', (await json('POST', '/comments', null, { target_type: 'ayah', target_key: '2:255', body: 'x' })).status === 401);

console.log('Üye:');
const created = await json('POST', '/comments', ali, { target_type: 'ayah', target_key: '2:255', body: `e2e public yorum ${suffix}` });
check('public yorum yazar (201)', created.status === 201);
const publicComment = await created.json();

const priv = await json('POST', '/comments', ali, { target_type: 'ayah', target_key: '2:255', body: `e2e private yorum ${suffix}`, visibility: 'private' });
check('private yorum yazar (201)', priv.status === 201);
const privComment = await priv.json();

console.log('Hedef tipleri:');
for (const [type, key] of [['word', '2:255:3'], ['page', '42'], ['surah', '2']]) {
  const r = await json('POST', '/comments', ali, { target_type: type, target_key: key, body: `e2e ${type} yorumu ${suffix}` });
  check(`${type} hedefine yazar`, r.status === 201);
}
console.log('Geçersiz hedefler (400):');
for (const [type, key] of [['ayah', '2:999'], ['surah', '115'], ['word', '2:255:99'], ['page', '605'], ['ayah', 'abc']]) {
  check(`${type}:${key} reddedilir`, (await json('POST', '/comments', ali, { target_type: type, target_key: key, body: 'x' })).status === 400);
}

console.log('Görünürlük:');
const guestList = await (await fetch(`${API}/comments?type=ayah&key=2:255`)).json();
check('misafir public görür', guestList.some((c) => c.id === publicComment.id));
check('misafir private GÖRMEZ', !guestList.some((c) => c.id === privComment.id));
const veliList = await (await json('GET', '/comments?type=ayah&key=2:255', veli)).json();
check('başka üye private GÖRMEZ', !veliList.some((c) => c.id === privComment.id));
const aliList = await (await json('GET', '/comments?type=ayah&key=2:255', ali)).json();
check('sahibi private görür', aliList.some((c) => c.id === privComment.id));

console.log('Etkileşim:');
const reply = await json('POST', '/comments', veli, { target_type: 'ayah', target_key: '2:255', body: 'e2e yanıt', parent_id: Number(publicComment.id) });
check('yanıt yazılır', reply.status === 201);
const quoted = await json('POST', '/comments', veli, { target_type: 'ayah', target_key: '2:255', body: 'e2e alıntı', quote_id: Number(publicComment.id) });
check('alıntı yapılır', quoted.status === 201);
const quotePriv = await json('POST', '/comments', veli, { target_type: 'ayah', target_key: '2:255', body: 'x', quote_id: Number(privComment.id) });
check('başkasının private yorumu ALINTILANAMAZ', quotePriv.status === 404);

console.log('Sahiplik:');
check('başkasının yorumunu silemez (403)', (await json('DELETE', `/comments/${publicComment.id}`, veli)).status === 403);
check('kendi yorumunu düzenler', (await json('PATCH', `/comments/${publicComment.id}`, ali, { body: 'düzenlendi' })).status === 200);
check('kendi yorumunu siler (204)', (await json('DELETE', `/comments/${publicComment.id}`, ali)).status === 204);

console.log('Sayımlar:');
const counts = await (await fetch(`${API}/comments/counts?surah=2`)).json();
check('ayet sayımı yansır', (counts.ayahs['255'] ?? 0) >= 2, JSON.stringify(counts.ayahs));
check('kelime sayımı yansır', (counts.words['2:255:3'] ?? 0) >= 1);
check('sure sayımı yansır', counts.surah >= 1);

console.log('Profil:');
const me = await (await json('GET', '/users/me', ali)).json();
check('JIT kullanıcı oluştu', me.username === `e2e_ali_${suffix}`);
check('profil güncellenir', (await json('PATCH', '/users/me', ali, { bio: 'e2e bio' })).status === 200);
const pub = await (await fetch(`${API}/users/e2e_ali_${suffix}`)).json();
check('public profil görünür', pub.bio === 'e2e bio');
check('public profilde private yok', !pub.comments.some((c) => c.id === privComment.id));

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
