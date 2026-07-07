'use client';
import { useSettings } from '@/lib/settings';
import { t } from '@/lib/i18n';

export default function ThemeToggle() {
  const { settings, update } = useSettings();
  const dark = settings.theme === 'koyu';
  return (
    <button
      className="theme-toggle"
      title={t(settings.uiLang, dark ? 'themeToLight' : 'themeToDark')}
      onClick={() => update({ theme: dark ? 'acik' : 'koyu' })}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
