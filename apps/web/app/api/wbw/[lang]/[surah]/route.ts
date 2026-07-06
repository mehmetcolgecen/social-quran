import { getWordLangMap } from '@/lib/db';

const WBW_EXTRA = new Set(['ur', 'hi']); // tr/en sayfa yüküne gömülü

export async function GET(_req: Request, ctx: { params: Promise<{ lang: string; surah: string }> }) {
  const { lang, surah } = await ctx.params;
  const s = Number(surah);
  if (!WBW_EXTRA.has(lang) || !Number.isInteger(s) || s < 1 || s > 114) {
    return Response.json({ error: 'geçersiz istek' }, { status: 400 });
  }
  return Response.json(getWordLangMap(lang, s), {
    headers: { 'cache-control': 'public, max-age=86400' },
  });
}
