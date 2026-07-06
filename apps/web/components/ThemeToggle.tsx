'use client';
import { useSettings } from '@/lib/settings';

export default function ThemeToggle() {
  const { settings, update } = useSettings();
  const dark = settings.theme === 'koyu';
  return (
    <button
      className="theme-toggle"
      title={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      onClick={() => update({ theme: dark ? 'acik' : 'koyu' })}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
