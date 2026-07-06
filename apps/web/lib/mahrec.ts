// Basitleştirilmiş mahreç renklendirmesi (v1) — bkz. ON_HAZIRLIK.md:
// el-Cevf ve el-Hayşûm gerçekte bağlam kurallarıdır; burada harf-tabanlı yaklaşım kullanılır
// (و her zaman eş-Şefetân, ا med kabul edilir). el-Hayşûm (ğunne) bu sürümde renklendirilmez.
export const MAHREC_GROUPS = [
  { key: 'cevf', label: 'el-Cevf (boşluk)', color: '#e53935' },
  { key: 'halk', label: 'el-Halk (boğaz)', color: '#8e24aa' },
  { key: 'lisan', label: 'el-Lisân (dil)', color: '#1e88e5' },
  { key: 'sefetan', label: 'eş-Şefetân (dudaklar)', color: '#43a047' },
] as const;

const COLOR: Record<string, string> = Object.fromEntries(MAHREC_GROUPS.map((g) => [g.key, g.color]));

const CHAR_GROUP = new Map<string, string>();
for (const c of 'اٰآىٱ') CHAR_GROUP.set(c, 'cevf');
for (const c of 'ءهعحغخأإئؤ') CHAR_GROUP.set(c, 'halk');
for (const c of 'فبمو') CHAR_GROUP.set(c, 'sefetan');
for (const c of 'قكجشيضلنرطدتظذثصزسة') CHAR_GROUP.set(c, 'lisan');

let segmenter: Intl.Segmenter | null = null;

// Kelimeyi grafem kümelerine böler (taban harf + harekeler birlikte kalır) ve mahreç rengini atar.
export function mahrecSegments(word: string): { text: string; color: string | null }[] {
  segmenter ??= new Intl.Segmenter('ar', { granularity: 'grapheme' });
  return [...segmenter.segment(word)].map(({ segment }) => {
    const group = CHAR_GROUP.get(segment[0]);
    return { text: segment, color: group ? COLOR[group] : null };
  });
}
