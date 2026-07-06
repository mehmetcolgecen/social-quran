'use client';
// Okuma ayarları — anında uygulanır (client-side), localStorage'da saklanır.
// Üye profili senkronizasyonu Faz 2'de eklenecek.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Settings = {
  mode: 'renkli' | 'siyah' | 'mahrec';
  wordTr: boolean;
  wordEn: boolean;
  meal: 'kapali' | 'tr' | 'en' | 'iki';
  fontScale: number;
  reciter: string;
  comments: boolean; // yorum rozetleri/kutuları tamamen kapatılabilir (GOAL gereksinimi)
  theme: 'acik' | 'koyu';
  arFont: 'hafs' | 'amiri' | 'sheherazade' | 'noto';
};

export const DEFAULT_SETTINGS: Settings = {
  mode: 'renkli',
  wordTr: true,
  wordEn: true,
  meal: 'tr',
  fontScale: 1,
  reciter: 'Husary_64kbps',
  comments: true,
  theme: 'acik',
  arFont: 'hafs',
};

const STORAGE_KEY = 'sk-settings';

const Ctx = createContext<{ settings: Settings; update: (patch: Partial<Settings>) => void }>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } catch { /* bozuk kayıt yok sayılır */ }
  }, []);

  // Tema ve Arapça font tüm sayfayı etkiler → <html> data attribute'larıyla CSS'e aktarılır
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.arfont = settings.arFont;
  }, [settings.theme, settings.arFont]);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* dolu olabilir */ }
      return next;
    });
  };

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
