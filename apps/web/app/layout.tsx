import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { SettingsProvider } from '@/lib/settings';
import PwaRegister from '@/components/PwaRegister';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { HeaderLinks, HeaderSearch, LangToggle } from '@/components/HeaderNav';
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
const sheherazade = localFont({
  src: '../fonts/ScheherazadeNew-Regular.woff2',
  variable: '--font-sheherazade',
  display: 'swap',
  preload: false,
});
const lateef = localFont({
  src: '../fonts/Lateef-Regular.woff2',
  variable: '--font-lateef',
  display: 'swap',
  preload: false,
});
const ruqaa = localFont({
  src: '../fonts/ArefRuqaa-Regular.ttf',
  variable: '--font-ruqaa',
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
    <html lang="tr" className={`${hafs.variable} ${amiriQuran.variable} ${sheherazade.variable} ${lateef.variable} ${ruqaa.variable} ${caveat.variable}`}>
      <body>
        <PwaRegister />
        <SettingsProvider>
          <header className="site-header">
            <Link href="/" className="brand"><span className="brand-mark">۞</span>Sosyal Kur&rsquo;an</Link>
            <HeaderLinks />
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
