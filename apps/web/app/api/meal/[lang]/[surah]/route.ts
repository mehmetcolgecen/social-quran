import { getMealMap } from '@/lib/db';
import { LANGS } from '@/lib/langs';

export async function GET(_req: Request, ctx: { params: Promise<{ lang: string; surah: string }> }) {
  const { lang, surah } = await ctx.params;
  const s = Number(surah);
  if (!LANGS.some((l) => l.code === lang) || !Number.isInteger(s) || s < 1 || s > 114) {
    return Response.json({ error: 'geçersiz istek' }, { status: 400 });
  }
  return Response.json(getMealMap(lang, s), {
    headers: { 'cache-control': 'public, max-age=86400' },
  });
}
