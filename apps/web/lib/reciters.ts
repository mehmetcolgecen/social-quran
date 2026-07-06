// Kâri meta verileri — DB'deki slug/name ile eşleşir; rozet ve monogram avatar bilgisi.
// Not: Gerçek fotoğraflar telif/izin gerektirdiğinden hat üslubunda monogram madalyonlar kullanılır.
export type ReciterMeta = {
  slug: string;
  short: string;      // madalyon monogramı
  tag: string;        // rozet etiketi
  tagIcon: string;
  desc: string;
  wordTiming: boolean; // kelime-seviyesi takip var mı
  hue: number;         // madalyon renk tonu
};

export const RECITER_META: Record<string, ReciterMeta> = {
  Husary_64kbps: {
    slug: 'Husary_64kbps', short: 'حص', tag: 'Tecvid üstadı', tagIcon: '🏆',
    desc: 'Mısır — Kur’an tilavetinin klasik hocası', wordTiming: true, hue: 205,
  },
  Abdul_Basit_Murattal_64kbps: {
    slug: 'Abdul_Basit_Murattal_64kbps', short: 'عب', tag: 'Efsane ses', tagIcon: '🏆',
    desc: 'Mısır — dünyaca ünlü altın gırtlak', wordTiming: true, hue: 25,
  },
  Alafasy_128kbps: {
    slug: 'Alafasy_128kbps', short: 'عف', tag: 'Kuveyt imamı', tagIcon: '🕌',
    desc: 'Kuveyt Büyük Camii imamı', wordTiming: true, hue: 145,
  },
  Minshawy_Murattal_128kbps: {
    slug: 'Minshawy_Murattal_128kbps', short: 'من', tag: 'Klasik ekol', tagIcon: '🏆',
    desc: 'Mısır — hüzünlü tilavetin ustası', wordTiming: true, hue: 275,
  },
  'Abdurrahmaan_As-Sudais_192kbps': {
    slug: 'Abdurrahmaan_As-Sudais_192kbps', short: 'سد', tag: 'Kâbe imamı', tagIcon: '🕋',
    desc: 'Mescid-i Haram baş imamı', wordTiming: true, hue: 45,
  },
  'Saood_ash-Shuraym_128kbps': {
    slug: 'Saood_ash-Shuraym_128kbps', short: 'شر', tag: 'Kâbe imamı', tagIcon: '🕋',
    desc: 'Mescid-i Haram imamı', wordTiming: true, hue: 190,
  },
  MaherAlMuaiqly128kbps: {
    slug: 'MaherAlMuaiqly128kbps', short: 'مع', tag: 'Kâbe imamı', tagIcon: '🕋',
    desc: 'Mescid-i Haram imamı', wordTiming: false, hue: 350,
  },
  Ghamadi_40kbps: {
    slug: 'Ghamadi_40kbps', short: 'غم', tag: 'Sevilen ses', tagIcon: '⭐',
    desc: 'Suudi Arabistan — yumuşak tilavet', wordTiming: false, hue: 95,
  },
};
