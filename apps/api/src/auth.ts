// OIDC Bearer JWT doğrulaması — issuer'ın JWKS'i ile imza kontrolü (jose).
// Dev'de issuer mock (packages/devstack), prod'da Keycloak realm; kod aynıdır.
import {
  CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { config } from './config';
import { pool } from './db';

export type Role = 'user' | 'moderator' | 'admin';
export type AuthUser = { sub: string; username: string; name: string; role: Role };

// Keycloak realm rolleri token'da realm_access.roles içinde gelir; dev issuer aynı formatı üretir.
function roleFromClaims(payload: Record<string, unknown>): Role {
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  const roles = realmAccess?.roles ?? (payload.roles as string[] | undefined) ?? [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('moderator')) return 'moderator';
  return 'user';
}

export const ACCESS_KEY = 'sk-access';
// Varsayılan: auth zorunlu. @Public: token bakılmaz. @OptionalAuth: token varsa doğrulanır.
export const Public = () => SetMetadata(ACCESS_KEY, 'public');
export const OptionalAuth = () => SetMetadata(ACCESS_KEY, 'optional');

export const CurrentUser = createParamDecorator((_data, ctx: ExecutionContext): AuthUser | null => {
  return ctx.switchToHttp().getRequest().authUser ?? null;
});

let jwks: JWTVerifyGetKey | null = null;
async function getJwks(): Promise<JWTVerifyGetKey> {
  if (!jwks) {
    const res = await fetch(`${config.oidcIssuer}/.well-known/openid-configuration`);
    if (!res.ok) throw new Error(`OIDC discovery başarısız: ${res.status}`);
    const discovery = (await res.json()) as { jwks_uri: string };
    jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
  }
  return jwks;
}

// JIT kullanıcı: ilk doğrulanmış istekte OIDC claim'lerinden yerel kayıt açılır (Keycloak pratiği).
const knownSubs = new Set<string>();
async function ensureUser(user: AuthUser): Promise<void> {
  if (knownSubs.has(user.sub)) return;
  try {
    await pool.query(
      'INSERT INTO users (id, username, display_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [user.sub, user.username, user.name || user.username],
    );
  } catch (err: unknown) {
    // Kullanıcı adı başka bir sub tarafından alınmışsa kısa sonek eklenir
    if ((err as { code?: string }).code === '23505') {
      await pool.query(
        'INSERT INTO users (id, username, display_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [user.sub, `${user.username}_${user.sub.slice(0, 4)}`, user.name || user.username],
      );
    } else throw err;
  }
  knownSubs.add(user.sub);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const access = this.reflector.getAllAndOverride<string>(ACCESS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (access === 'public') return true;

    const req = ctx.switchToHttp().getRequest();
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    if (!token) {
      if (access === 'optional') return true;
      throw new UnauthorizedException('Giriş gerekli');
    }
    try {
      const { payload } = await jwtVerify(token, await getJwks(), {
        issuer: config.oidcIssuer,
        ...(config.oidcAudience ? { audience: config.oidcAudience } : {}),
      });
      const user: AuthUser = {
        sub: String(payload.sub),
        username: String(payload.preferred_username ?? payload.sub),
        name: String(payload.name ?? payload.preferred_username ?? ''),
        role: roleFromClaims(payload as Record<string, unknown>),
      };
      await ensureUser(user);
      req.authUser = user;
      return true;
    } catch {
      if (access === 'optional') return true;
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
    }
  }
}
