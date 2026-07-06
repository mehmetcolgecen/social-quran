// Oturum çerezi — httpOnly, jose ile şifreli (A256GCM). Access token tarayıcıya sızmaz;
// API çağrıları /api/social proxy'si üzerinden Bearer eklenerek yapılır.
import { createHash } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';

const key = createHash('sha256')
  .update(process.env.SESSION_SECRET ?? 'dev-secret-sosyal-kuran-degistir')
  .digest();

export const SESSION_COOKIE = 'sk_session';

export type Session = { sub: string; username: string; name: string; at: string };

export async function sealSession(session: Session, expiresInSec: number): Promise<string> {
  return new EncryptJWT({ ...session })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSec}s`)
    .encrypt(key);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtDecrypt(raw, key);
    return { sub: String(payload.sub), username: String(payload.username), name: String(payload.name), at: String(payload.at) };
  } catch {
    return null; // süresi dolmuş/bozuk çerez → misafir
  }
}
