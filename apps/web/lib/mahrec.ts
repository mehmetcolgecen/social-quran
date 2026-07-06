// Basitleştirilmiş mahreç renklendirmesi (v1) — bkz. ON_HAZIRLIK.md:
// el-Cevf ve el-Hayşûm gerçekte bağlam kurallarıdır; burada harf-tabanlı yaklaşım kullanılır
// (و her zaman eş-Şefetân, ا med kabul edilir). el-Hayşûm (ğunne) bu sürümde renklendirilmez.
// Renkler tema-duyarlı CSS değişkenlerinden gelir (--mh-*).
// Okunabilirlik için el-Lisân (harflerin çoğunluğu) renklendirilmez — nötr (siyah) kalır;
// yalnızca tecvid takibinde ayırt edilmesi kritik bölgeler boyanır.
export const MAHREC_GROUPS = [
  { key: 'cevf', label: 'el-Cevf (boşluk)', neutral: false },
  { key: 'halk', label: 'el-Halk (boğaz)', neutral: false },
  { key: 'sefetan', label: 'eş-Şefetân (dudaklar)', neutral: false },
  { key: 'lisan', label: 'el-Lisân (dil) — nötr', neutral: true },
] as const;

const CHAR_GROUP = new Map<string, string>();
for (const c of 'اٰآىٱ') CHAR_GROUP.set(c, 'cevf');
for (const c of 'ءهعحغخأإئؤ') CHAR_GROUP.set(c, 'halk');
for (const c of 'فبمو') CHAR_GROUP.set(c, 'sefetan');

let segmenter: Intl.Segmenter | null = null;

// Kelimeyi grafem kümelerine böler (taban harf + harekeler birlikte kalır) ve mahreç grubunu atar.
export function mahrecSegments(word: string): { text: string; group: string | null }[] {
  segmenter ??= new Intl.Segmenter('ar', { granularity: 'grapheme' });
  return [...segmenter.segment(word)].map(({ segment }) => ({
    text: segment,
    group: CHAR_GROUP.get(segment[0]) ?? null,
  }));
}
