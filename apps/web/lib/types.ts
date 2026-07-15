export type Surah = {
  id: number;
  name_arabic: string;
  name_simple: string;
  name_tr: string;
  name_en: string;
  revelation_place: string;
  verses_count: number;
  start_page?: number; // yalnız getSurahs doldurur (mushaftaki ilk sayfa)
};

export type Word = {
  p: number; // ayet içi pozisyon (1-tabanlı) — kelime anahtarı: `${surah}:${ayah}:${p}`
  ar: string;
  tr: string | null;
  en: string | null;
  tl: string | null; // transliterasyon (kelime popover'ında gösterilir)
};

export type Ayah = {
  ayah: number;
  key: string;
  page: number;
  juz: number;
  words: Word[];
  meal: { tr: string; en: string };
};

export type ReaderGroup = { surah: Surah; ayahs: Ayah[] };

export type Reciter = { slug: string; name: string };

// quran-align segmenti: [kelimeIdx_başlangıç, kelimeIdx_bitiş, başlangıç_ms, bitiş_ms]
export type AyahTiming = { ayah: number; segments: number[][] };
