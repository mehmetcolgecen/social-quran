import { existsSync } from 'node:fs';
import path from 'node:path';

function findLimitsFile(): string {
  if (process.env.TARGET_LIMITS_PATH) return process.env.TARGET_LIMITS_PATH;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const p = path.join(dir, 'data/processed/target-limits.json');
    if (existsSync(p)) return p;
    dir = path.dirname(dir);
  }
  throw new Error('target-limits.json bulunamadı — önce: npm run -w packages/quran-data build-db');
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/sosyal_kuran',
  oidcIssuer: process.env.OIDC_ISSUER ?? 'http://localhost:7788',
  // Çift domain (sosyal-kuran.com + social-quran.com): Keycloak hostname'i dinamik olduğundan
  // token iss'i kullanıcının girdiği domain'i taşır — hepsi kabul listesinde olmalı
  oidcIssuers: (process.env.OIDC_ISSUERS ?? process.env.OIDC_ISSUER ?? 'http://localhost:7788')
    .split(',').map((s) => s.trim()).filter(Boolean),
  // Keycloak'ta audience eşlemesi realm ayarına bağlıdır; boş bırakılırsa aud kontrolü yapılmaz
  oidcAudience: process.env.OIDC_AUDIENCE ?? 'sosyal-kuran-api',
  limitsPath: findLimitsFile(),
};
