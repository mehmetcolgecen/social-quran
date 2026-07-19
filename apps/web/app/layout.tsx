import type { Metadata } from 'next';
import { headers } from 'next/headers';
import localFont from 'next/font/local';
import { SettingsProvider } from '@/lib/settings';
import PwaRegister from '@/components/PwaRegister';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { HeaderMenu, HeaderSearch, LangToggle } from '@/components/HeaderNav';
import { Brand, FooterCredits } from '@/components/Chrome';
import './globals.css';

const hafs = localFont({
  src: '../fonts/UthmanicHafs1Ver18.woff2',
  variable: '--font-hafs',
  display: 'swap',
});
const amiriQuran = localFont({
  src: '../fonts/AmiriQuran.ttf',
  variable: '--font-amiri',
  display: 'swap',
  preload: false,
});
// Mushaf imlasını (hançer elif, vasıl hemzesi, gizli hareke kuralları) doğru basan
// fontlar dışındakiler kaldırıldı — genel Arapça fontlar Kur'an işaretlerini bozuyor.
const amiriQuranColored = localFont({
  src: '../fonts/AmiriQuranColored.ttf',
  variable: '--font-amiri-renkli',
  display: 'swap',
  preload: false,
});
const digitalKhatt = localFont({
  src: '../fonts/DigitalKhattMadina.otf',
  variable: '--font-dkhatt',
  display: 'swap',
  preload: false,
});
// İmlâî (Türkiye) metinle parlayan metin fontları — hançer elif + durak işaretleri
// kapsamı fontTools ile doğrulandı (U+0670, U+06D6-06DA)
const amiriMetin = localFont({
  src: '../fonts/Amiri-Regular.ttf',
  variable: '--font-amiri-metin',
  display: 'swap',
  preload: false,
});
const harmattan = localFont({
  src: '../fonts/Harmattan-Regular.ttf',
  variable: '--font-harmattan',
  display: 'swap',
  preload: false,
});
// Popüler Kur'an fontları (IndoPak ekolü) — kapsam fontTools ile doğrulandı,
// lisans notları data/LICENSES.md'de (Neirizi/Nabi/Muhammadi lisans gereği elendi)
const alQalam = localFont({
  src: '../fonts/AlQalamQuranMajeed.ttf',
  variable: '--font-alqalam',
  display: 'swap',
  preload: false,
});
const pdmsSaleem = localFont({
  src: '../fonts/PDMSSaleem.ttf',
  variable: '--font-saleem',
  display: 'swap',
  preload: false,
});
const meQuran = localFont({
  src: '../fonts/MeQuran.ttf',
  variable: '--font-mequran',
  display: 'swap',
  preload: false,
});
const alMushaf = localFont({
  src: '../fonts/AlMushaf.ttf',
  variable: '--font-almushaf',
  display: 'swap',
  preload: false,
});
// El yazısı not fontu (hâşiye görünümü) — latin-ext, Türkçe karakterleri kapsar
const caveat = localFont({
  src: '../fonts/Caveat.ttf',
  variable: '--font-note',
  display: 'swap',
  preload: false,
});

// Başlık/açıklama alan adına göre: social-quran.com İngilizce kimlikle sunulur
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') ?? '';
  const en = host.includes('social-quran');
  return {
    title: en
      ? { default: 'Social Quran', template: '%s — Social Quran' }
      : { default: 'Sosyal Kur’an', template: '%s — Sosyal Kur’an' },
    description: en
      ? 'Word-by-word, colorful Quran reading with audio tracking'
      : 'Kelime mealli, renkli, sesli takipli Kur’an-ı Kerim okuma platformu',
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icon.svg' },
  };
}

export const viewport = { themeColor: '#8a6d1d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${hafs.variable} ${amiriQuran.variable} ${amiriQuranColored.variable} ${digitalKhatt.variable} ${amiriMetin.variable} ${harmattan.variable} ${alQalam.variable} ${pdmsSaleem.variable} ${meQuran.variable} ${alMushaf.variable} ${caveat.variable}`}>
      <body>
        <PwaRegister />
        <SettingsProvider>
          <header className="site-header">
            <HeaderMenu />
            <Brand />
            {/* Okuyucu sayfalarında SettingsBar düğme grubunu buraya portallar */}
            <div id="header-orta" className="header-orta" />
            <HeaderSearch />
            <UserMenu />
            <LangToggle />
            <ThemeToggle />
          </header>
          {children}
          <footer className="site-footer">
            <FooterCredits />
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
