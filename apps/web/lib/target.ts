// Yorum hedefi yardımcıları — hem client hem server kullanır.
export type TargetType = 'word' | 'ayah' | 'page' | 'surah';
export type Target = { type: TargetType; key: string };

export function targetLabel(t: Target): string {
  if (t.type === 'surah') return `${t.key}. sure`;
  if (t.type === 'page') return `Sayfa ${t.key}`;
  if (t.type === 'ayah') return `${t.key} ayeti`;
  const [s, a, w] = t.key.split(':');
  return `${s}:${a} — ${w}. kelime`;
}

export function targetHref(t: Target): string {
  if (t.type === 'surah') return `/sure/${t.key}`;
  if (t.type === 'page') return `/sayfa/${t.key}`;
  const [s, a] = t.key.split(':');
  return `/sure/${s}#ayet-${s}-${a}`;
}
