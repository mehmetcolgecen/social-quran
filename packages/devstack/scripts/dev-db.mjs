// Yerel geliştirme PostgreSQL'i — gerçek PG binary'leri kullanıcı alanında çalışır (docker/root gerekmez).
// Prod'da aynı şema CNPG'ye gider; motor aynı olduğundan şema/SQL birebir taşınır.
// Çalıştır: npm run -w packages/devstack db  (açık kalır; Ctrl+C ile durur)
import EmbeddedPostgres from 'embedded-postgres';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DATA_DIR = path.join(ROOT, 'data/.dev/pg');
const PORT = 5433;
const DB_NAME = 'sosyal_kuran';

mkdirSync(DATA_DIR, { recursive: true });
const server = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
});

const fresh = readdirSync(DATA_DIR).length === 0;
if (fresh) await server.initialise();
await server.start();
if (fresh) await server.createDatabase(DB_NAME);
console.log(`PostgreSQL hazır: postgres://postgres:postgres@localhost:${PORT}/${DB_NAME}`);

// apps/api/migrations/*.sql sıralı ve idempotent uygulanır
const migDir = path.join(ROOT, 'apps/api/migrations');
const client = new pg.Client({ host: 'localhost', port: PORT, user: 'postgres', password: 'postgres', database: DB_NAME });
await client.connect();
for (const f of readdirSync(migDir).filter((x) => x.endsWith('.sql')).sort()) {
  await client.query(readFileSync(path.join(migDir, f), 'utf8'));
  console.log(`migrasyon: ${f} ✓`);
}
await client.end();

const shutdown = async () => { await server.stop(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
