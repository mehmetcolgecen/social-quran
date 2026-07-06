// Basit küfür filtresi (TR/EN) — kelime (token) bazlı tam eşleşme; dinî tartışma
// metinlerinde yanlış pozitif üretmemesi için kasıtlı olarak dar tutuldu.
// Prod'da daha kapsamlı bir çözümle (ör. hizmet/liste) değiştirilebilir.
const BLOCKLIST = new Set([
  'amk', 'aq', 'orospu', 'piç', 'pic', 'sik', 'yarrak', 'göt', 'got', 'ibne', 'pezevenk',
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'bastard',
]);

export function containsProfanity(text: string): boolean {
  return text
    .toLowerCase()
    .split(/[^a-zçğıöşü0-9]+/i)
    .some((token) => BLOCKLIST.has(token));
}
