// Basitleştirilmiş mahreç renklendirmesi (v1) — bkz. ON_HAZIRLIK.md:
// el-Cevf ve el-Hayşûm gerçekte bağlam kurallarıdır; burada harf-tabanlı yaklaşım kullanılır
// (و her zaman eş-Şefetân, ا med kabul edilir). el-Hayşûm (ğunne) bu sürümde renklendirilmez.
// Renkler tema-duyarlı CSS değişkenlerinden gelir (--mh-*).
export const MAHREC_GROUPS = [
  { key: 'cevf', label: 'el-Cevf (boşluk)' },
  { key: 'halk', label: 'el-Halk (boğaz)' },
  { key: 'lisan', label: 'el-Lisân (dil)' },
  { key: 'sefetan', label: 'eş-Şefetân (dudaklar)' },
] as const;

const CHAR_GROUP = new Map<string, string>();
for (const c of 'اٰآىٱ') CHAR_GROUP.set(c, 'cevf');
for (const c of 'ءهعحغخأإئؤ') CHAR_GROUP.set(c, 'halk');
for (const c of 'فبمو') CHAR_GROUP.set(c, 'sefetan');
for (const c of 'قكجشيضلنرطدتظذثصزسة') CHAR_GROUP.set(c, 'lisan');

let segmenter: Intl.Segmenter | null = null;

// Kelimeyi grafem kümelerine böler (taban harf + harekeler birlikte kalır) ve mahreç grubunu atar.
export function mahrecSegments(word: string): { text: string; group: string | null }[] {
  segmenter ??= new Intl.Segmenter('ar', { granularity: 'grapheme' });
  return [...segmenter.segment(word)].map(({ segment }) => ({
    text: segment,
    group: CHAR_GROUP.get(segment[0]) ?? null,
  }));
}
