import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { SettingsProvider } from '@/lib/settings';
import PwaRegister from '@/components/PwaRegister';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { HeaderMenu, HeaderSearch, LangToggle } from '@/components/HeaderNav';
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

export const metadata: Metadata = {
  title: { default: 'Sosyal Kur’an', template: '%s — Sosyal Kur’an' },
  description: 'Kelime mealli, renkli, sesli takipli Kur’an-ı Kerim okuma platformu',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};

export const viewport = { themeColor: '#8a6d1d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${hafs.variable} ${amiriQuran.variable} ${amiriQuranColored.variable} ${digitalKhatt.variable} ${amiriMetin.variable} ${harmattan.variable} ${alQalam.variable} ${pdmsSaleem.variable} ${meQuran.variable} ${alMushaf.variable} ${caveat.variable}`}>
      <body>
        <PwaRegister />
        <SettingsProvider>
          <header className="site-header">
            <HeaderMenu />
            <Link href="/" className="brand"><span className="brand-mark">۞</span>Sosyal Kur&rsquo;an</Link>
            {/* Okuyucu sayfalarında SettingsBar düğme grubunu buraya portallar */}
            <div id="header-orta" className="header-orta" />
            <HeaderSearch />
            <UserMenu />
            <LangToggle />
            <ThemeToggle />
          </header>
          {children}
          <footer className="site-footer">
            <p>
              Metin: <a href="https://tanzil.net" rel="noopener">Tanzil Project</a> · Kelime meal &amp; sayfa düzeni:{' '}
              <a href="https://qul.tarteel.ai" rel="noopener">QUL / quran.com</a> · Meal: Elmalılı Hamdi Yazır, Saheeh International ·
              Zamanlama: <a href="https://github.com/cpfair/quran-align" rel="noopener">quran-align</a> (CC-BY 4.0) ·
              Ses: <a href="https://everyayah.com" rel="noopener">everyayah.com</a> · Font: KFGQPC Uthmanic Hafs
            </p>
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
