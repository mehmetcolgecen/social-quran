// Desteklenen diller — bayraklar UI'da, kodlar DB/API'de kullanılır.
// wbw: kelime-kelime çevirisi mevcut mu (quran.com API yalnızca bu dillerde sağlıyor;
// diğerleri için yalnızca tam meal var). tr/en kelime verisi sayfa yüküne gömülü,
// ur/hi ile tüm mealler seçilince /api/wbw ve /api/meal'den tembel yüklenir.
export type LangCode = 'tr' | 'en' | 'ur' | 'hi' | 'de' | 'fr' | 'it' | 'es' | 'ko' | 'ja' | 'zh';

export const LANGS: { code: LangCode; flag: string; label: string; wbw: boolean }[] = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe', wbw: true },
  { code: 'en', flag: '🇬🇧', label: 'English', wbw: true },
  { code: 'ur', flag: '🇵🇰', label: 'اردو', wbw: true },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी', wbw: true },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch', wbw: false },
  { code: 'fr', flag: '🇫🇷', label: 'Français', wbw: false },
  { code: 'it', flag: '🇮🇹', label: 'Italiano', wbw: false },
  { code: 'es', flag: '🇪🇸', label: 'Español', wbw: false },
  { code: 'ko', flag: '🇰🇷', label: '한국어', wbw: false },
  { code: 'ja', flag: '🇯🇵', label: '日本語', wbw: false },
  { code: 'zh', flag: '🇨🇳', label: '中文', wbw: false },
];

export const WBW_LANGS = LANGS.filter((l) => l.wbw);
export const EMBEDDED_WBW: LangCode[] = ['tr', 'en']; // sayfa yüküne gömülü
export const EMBEDDED_MEAL: LangCode[] = ['tr', 'en'];
export const flagOf = (code: string) => LANGS.find((l) => l.code === code)?.flag ?? '🌐';
