// Ayet mp3 akışı — Range destekli (ses çubuğunda ileri/geri sarma için).
// Prod'da bu dosyalar ingress/CDN arkasına alınacak; dev'de dosya sisteminden akar.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { isValidReciter, repoRoot } from '@/lib/db';

export async function GET(req: Request, ctx: { params: Promise<{ reciter: string; file: string }> }) {
  const { reciter, file } = await ctx.params;
  if (!isValidReciter(reciter) || !/^\d{6}\.mp3$/.test(file)) return new Response(null, { status: 404 });
  const filePath = path.join(repoRoot(), 'data/audio', reciter, file);
  if (!existsSync(filePath)) return new Response(null, { status: 404 });

  const size = statSync(filePath).size;
  const headers: Record<string, string> = {
    'content-type': 'audio/mpeg',
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=31536000, immutable',
  };
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') ?? '');
  if (m) {
    const start = m[1] ? Number(m[1]) : 0;
    const end = m[2] ? Number(m[2]) : size - 1;
    if (start > end || end >= size) return new Response(null, { status: 416 });
    headers['content-range'] = `bytes ${start}-${end}/${size}`;
    headers['content-length'] = String(end - start + 1);
    return new Response(Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream, { status: 206, headers });
  }
  headers['content-length'] = String(size);
  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, { status: 200, headers });
}
