// Öğren bölümü: örnek metinler/harfler için Kur'an'dan kelime + konum bulur
// (Husary ses segmentiyle çalınabilsin diye).
import { ogrenLookup } from '@/lib/db';

export async function POST(req: Request) {
  let body: { texts?: string[]; letters?: string[] };
  try { body = await req.json(); } catch { return Response.json({ error: 'geçersiz' }, { status: 400 }); }
  const texts = Array.isArray(body.texts) ? body.texts.filter((t) => typeof t === 'string') : [];
  const letters = Array.isArray(body.letters) ? body.letters.filter((t) => typeof t === 'string') : [];
  return Response.json(ogrenLookup(texts, letters), {
    headers: { 'cache-control': 'public, max-age=86400' },
  });
}
