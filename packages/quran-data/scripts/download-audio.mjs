// everyayah.com ayet-ayet mp3 arşivleri — kâri başına tek zip, curl -C - ile resume edilir.
// İdempotent: her kâri dizinindeki .complete işareti varsa atlanır; zip açılıp doğrulanınca silinir.
import { execFileSync, spawnSync } from 'node:child_process';
import { readdir, rm, writeFile } from 'node:fs/promises';
import { AUDIO, RECITERS, ensureDir, exists } from './lib.mjs';

const EXPECTED_FILES = 6236;

for (const { slug, local } of RECITERS) {
  if (local) { console.log(`${slug}: yerel kâri (everyayah'ta yok), indirme atlandı`); continue; }
  const dir = `${AUDIO}${slug}`;
  if (await exists(`${dir}/.complete`)) { console.log(`${slug}: tamam, atlandı`); continue; }
  await ensureDir(`${AUDIO}zips`);
  await ensureDir(dir);
  const zip = `${AUDIO}zips/${slug}.zip`;
  const url = `https://everyayah.com/data/${slug}/000_versebyverse.zip`;
  console.log(`${slug}: indiriliyor…`);
  const dl = spawnSync('curl', ['-fL', '-C', '-', '--retry', '10', '--retry-delay', '5', '-o', zip, url], { stdio: 'inherit' });
  if (dl.status !== 0) throw new Error(`${slug}: indirme başarısız (curl ${dl.status})`);
  console.log(`${slug}: açılıyor…`);
  execFileSync('python3', ['-m', 'zipfile', '-e', zip, dir]);
  const mp3s = (await readdir(dir)).filter((f) => /^\d{6}\.mp3$/.test(f));
  if (mp3s.length < EXPECTED_FILES) throw new Error(`${slug}: ${mp3s.length}/${EXPECTED_FILES} dosya — eksik arşiv`);
  await writeFile(`${dir}/.complete`, `${mp3s.length} dosya\n`);
  await rm(zip);
  console.log(`${slug}: ${mp3s.length} mp3 hazır`);
}
console.log('Tüm kâriler indirildi.');
