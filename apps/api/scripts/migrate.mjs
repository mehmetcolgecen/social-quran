// Migrasyonları sıralı ve idempotent uygular — prod'da api pod'unun initContainer'ı çalıştırır.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
  await client.query(readFileSync(path.join(dir, f), 'utf8'));
  console.log(`migrasyon: ${f} ✓`);
}
await client.end();
