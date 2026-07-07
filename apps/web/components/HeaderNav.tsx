'use client';
// Üst bar menüsü + arama + dil anahtarı — etiketler arayüz diline (tr/en) göre çevrilir.
import Link from 'next/link';
import { useSettings } from '@/lib/settings';
import { t } from '@/lib/i18n';

export function HeaderLinks() {
  const { settings } = useSettings();
  const L = settings.uiLang;
  return (
    <nav>
      <Link href="/">{t(L, 'surahs')}</Link>
      <Link href="/ogren">{t(L, 'learn')}</Link>
      <Link href="/hakikatler" title={t(L, 'truthsTitle')}>{t(L, 'truths')}</Link>
      <Link href="/yer-imleri">{t(L, 'bookmarks')}</Link>
      <Link href="/plan">{t(L, 'plan')}</Link>
    </nav>
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
  return (
    <select
      className="lang-select"
      value={settings.uiLang}
      title={t(settings.uiLang, 'langLabel')}
      aria-label={t(settings.uiLang, 'langLabel')}
      onChange={(e) => update({ uiLang: e.target.value as 'tr' | 'en' })}
    >
      <option value="tr">TR</option>
      <option value="en">EN</option>
    </select>
  );
}
