// quran-align kelime zamanlamaları — client, kâri/sure değişince çeker.
import { getTimings, isValidReciter } from '@/lib/db';

export async function GET(_req: Request, ctx: { params: Promise<{ reciter: string; surah: string }> }) {
  const { reciter, surah } = await ctx.params;
  const s = Number(surah);
  if (!isValidReciter(reciter) || !Number.isInteger(s) || s < 1 || s > 114) {
    return Response.json({ error: 'geçersiz istek' }, { status: 400 });
  }
  return Response.json(getTimings(reciter, s), {
    headers: { 'cache-control': 'public, max-age=86400' },
  });
}
