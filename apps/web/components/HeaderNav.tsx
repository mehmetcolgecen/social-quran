'use client';
// Üst bar: solda hamburger ile açılıp kapanan menü çekmecesi + arama + dil anahtarı.
// Etiketler arayüz diline (tr/en) göre çevrilir. Çekmece document.body'ye portallanır:
// üst bardaki backdrop-filter, fixed torunlar için containing block oluşturur ve
// çekmeceyi barın içine hapseder (bir kez yaşandı, tekrar etme).
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/lib/settings';
import { t } from '@/lib/i18n';
import ReaderSettings from './ReaderSettings';

export function HeaderMenu() {
  const { settings } = useSettings();
  const L = settings.uiLang;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince ve Escape'te çekmece kapanır
  useEffect(() => { setOpen(false); }, [pathname]);
  // Okuyucu başlığındaki ⚙ Ayarlar düğmesi çekmeceyi buradan açar
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('sk-open-menu', onOpen);
    return () => window.removeEventListener('sk-open-menu', onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Okuma sayfalarında ayarlar da çekmecede gösterilir (üst çubukta yalnız Dinle kaldı)
  const isReader = pathname.startsWith('/sure/') || pathname.startsWith('/sayfa/');

  return (
    <>
      <button
        className="hmenu-btn"
        aria-expanded={open}
        aria-label={t(L, 'menu')}
        title={t(L, 'menu')}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '☰'}
      </button>
      {open && createPortal(
        <>
          <div className="hmenu-backdrop" onClick={() => setOpen(false)} />
          <nav className="hmenu-drawer" aria-label={t(L, 'menu')}>
            <Link href="/">🕮 {t(L, 'surahs')}</Link>
            <Link href="/ogren">🎓 {t(L, 'learn')}</Link>
            <Link href="/hakikatler" title={t(L, 'truthsTitle')}>🔬 {t(L, 'truths')}</Link>
            <Link href="/yer-imleri">🔖 {t(L, 'bookmarks')}</Link>
            <Link href="/plan">📅 {t(L, 'plan')}</Link>
            {isReader && (
              <>
                <div className="hmenu-sep" role="separator" />
                <small className="hmenu-title">{t(L, 'readingSettings')}</small>
                <ReaderSettings frameSelect={pathname.startsWith('/sayfa/')} />
              </>
            )}
          </nav>
        </>,
        document.body,
      )}
    </>
  );
}

export function HeaderSearch() {
  const { settings } = useSettings();
  const L = settings.uiLang;
  return (
    <form action="/ara" className="hsearch">
      <input name="q" placeholder={t(L, 'searchPh')} aria-label={t(L, 'searchLabel')} />
    </form>
  );
}

export function LangToggle() {
  const { settings, update } = useSettings();
  // EN ↔ TR seçimi canlıda alan adını da değiştirir: EN → social-quran.com,
  // TR → sosyal-kuran.com (aynı yol korunur). Yerelde yalnız dil değişir.
  const onChange = (lang: 'tr' | 'en') => {
    update({ uiLang: lang });
    const host = window.location.hostname;
    const target = lang === 'en' ? 'social-quran.com' : 'sosyal-kuran.com';
    if ((host.includes('sosyal-kuran') || host.includes('social-quran')) && !host.includes(target)) {
      window.location.href = `https://${target}${window.location.pathname}${window.location.search}${window.location.hash}`;
    }
  };
  return (
    <select
      className="lang-select"
      value={settings.uiLang}
      title={t(settings.uiLang, 'langLabel')}
      aria-label={t(settings.uiLang, 'langLabel')}
      onChange={(e) => onChange(e.target.value as 'tr' | 'en')}
    >
      <option value="tr">TR</option>
      <option value="en">EN</option>
    </select>
  );
}
