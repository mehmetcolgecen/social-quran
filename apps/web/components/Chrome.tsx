'use client';
// Üst bar markası + altbilgi + giriş hatası — dil anahtarına göre metin seçen küçük
// krom adacıkları (layout server bileşeni olduğundan buradalar).
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export function Brand() {
  const t = useT();
  return (
    <Link href="/" className="brand"><span className="brand-mark">۞</span>{t('brand')}</Link>
  );
}

export function FooterCredits() {
  const t = useT();
  return (
    <p>
      {t('fText')}: <a href="https://tanzil.net" rel="noopener">Tanzil Project</a> · {t('fWbw')}:{' '}
      <a href="https://qul.tarteel.ai" rel="noopener">QUL / quran.com</a> · {t('fMeal')}: Elmalılı Hamdi Yazır, Saheeh International ·{' '}
      {t('fTiming')}: <a href="https://github.com/cpfair/quran-align" rel="noopener">quran-align</a> (CC-BY 4.0) ·{' '}
      {t('fAudio')}: <a href="https://everyayah.com" rel="noopener">everyayah.com</a> · {t('fFont')}: KFGQPC Uthmanic Hafs
    </p>
  );
}

export function LoginError({ code }: { code: string }) {
  const t = useT();
  const reason = code === 'state' ? t('errState') : code === 'token' ? t('errToken') : code === 'kimlik' ? t('errKimlik') : t('errFlow');
  return (
    <p className="cerror" role="alert">
      {t('loginFailed')} ({reason}). {t('tryAgain')} <a href="/api/auth/login?next=/">{t('tryAgainLink')}</a>.
    </p>
  );
}
