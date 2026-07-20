// Elifba seslendirme üretimi — lib/ogren.ts'teki tüm `ses` öğelerini toplar,
// Microsoft Edge neural TTS (ar-SA) ile public/elifba/<id>.mp3 üretir.
// Var olan dosyalar atlanır (resumable). Çalıştırma: npm run -w apps/web elifba-tts
// Node 22.6+ gerektirir (yerleşik TypeScript type stripping ile .ts import eder).
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DERSLER, type Ornek } from '../lib/ogren.ts';

const VOICE = process.env.ELIFBA_VOICE ?? 'ar-SA-HamedNeural';
// Harf ADLARI Türk elifba geleneğiyle okunur (ha, ze, dad — Arapça hâ/zây/dâd değil):
// h-* kimlikleri Türkçe neural sesle, Türkçe adla üretilir; heceler/kelimeler Arapça kalır.
const VOICE_TR = process.env.ELIFBA_VOICE_TR ?? 'tr-TR-AhmetNeural';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/elifba');

// Ses kimliği → okunacak metin + ses. Aynı kimlik farklı metinle iki kez tanımlanırsa hata.
const items = new Map<string, { text: string; voice: string }>();
function add(id: string | undefined, text: string, voice = VOICE) {
  if (!id) return;
  const prev = items.get(id);
  if (prev !== undefined && prev.text !== text) {
    throw new Error(`Ses kimliği çakışması: "${id}" hem "${prev.text}" hem "${text}" için kullanılmış`);
  }
  items.set(id, { text, voice });
}
// TTS bazı tek heceli adları fısıltıya çevirir ("hı" → sessiz çıktı!) — yazım istisnaları:
const TR_AD_DUZELTME: Record<string, string> = { 'hı': 'hıı' };
const addOrnek = (o: Ornek) => add(o.ses, o.tts ?? o.ar);
for (const ders of DERSLER) {
  ders.examples?.forEach(addOrnek);
  for (const harf of ders.harfler ?? []) {
    add(harf.ses, TR_AD_DUZELTME[harf.name] ?? harf.name, VOICE_TR); // Türkçe elifba adı
    harf.ornekler.forEach(addOrnek);
  }
}

// Kısa öğeler daha yavaş okunur: heceler (s-) en yavaş, harf adları (h-) yavaş, kelimeler (k-) hafif yavaş.
const rateFor = (id: string) => (id.startsWith('s-') ? '-30%' : id.startsWith('h-') ? '-25%' : '-15%');

const ttsByVoice = new Map<string, MsEdgeTTS>();
async function synth(text: string, rate: string, voice: string): Promise<Buffer> {
  let tts = ttsByVoice.get(voice);
  if (!tts) {
    tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    ttsByVoice.set(voice, tts);
  }
  const { audioStream } = await tts.toStream(text, { rate });
  const chunks: Buffer[] = [];
  for await (const c of audioStream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

mkdirSync(OUT_DIR, { recursive: true });
let yeni = 0, atlanan = 0, hata = 0;
for (const [id, { text, voice }] of items) {
  const file = path.join(OUT_DIR, `${id}.mp3`);
  if (existsSync(file)) { atlanan++; continue; }
  let buf: Buffer | null = null;
  for (let deneme = 1; deneme <= 3 && !buf; deneme++) {
    try {
      buf = await synth(text, rateFor(id), voice);
    } catch (e) {
      ttsByVoice.delete(voice); // bağlantı koptuysa yeniden kur
      if (deneme === 3) { console.error(`✗ ${id} (${text}): ${(e as Error).message}`); hata++; }
      else await new Promise((r) => setTimeout(r, 1500 * deneme));
    }
  }
  if (!buf) continue;
  if (buf.length < 1000) { console.error(`✗ ${id}: şüpheli küçük çıktı (${buf.length} bayt), yazılmadı`); hata++; continue; }
  writeFileSync(file, buf);
  yeni++;
  console.log(`✓ ${id} ← ${text} (${(buf.length / 1024).toFixed(1)} KB)`);
}
console.log(`\nBitti: ${yeni} üretildi, ${atlanan} zaten vardı, ${hata} hata, toplam ${items.size} öğe (ar: ${VOICE}, tr: ${VOICE_TR}).`);
if (hata > 0) process.exit(1);
