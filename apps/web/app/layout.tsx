import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Link from 'next/link';
import { SettingsProvider } from '@/lib/settings';
import './globals.css';

const hafs = localFont({
  src: '../fonts/UthmanicHafs1Ver18.woff2',
  variable: '--font-hafs',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Sosyal Kur’an', template: '%s — Sosyal Kur’an' },
  description: 'Kelime mealli, renkli, sesli takipli Kur’an-ı Kerim okuma platformu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={hafs.variable}>
      <body>
        <SettingsProvider>
          <header className="site-header">
            <Link href="/" className="brand">Sosyal Kur&rsquo;an</Link>
            <nav><Link href="/">Sureler</Link></nav>
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
