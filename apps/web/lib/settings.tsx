'use client';
// Okuma ayarları — anında uygulanır (client-side), localStorage'da saklanır.
// Üye profili senkronizasyonu Faz 2'de eklenecek.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Settings = {
  mode: 'renkli' | 'siyah' | 'mahrec';
  wordLangs: string[]; // kelime altı anlam dilleri (wbw destekli: tr/en/ur/hi)
  meals: string[];     // ayet meali dilleri (11 dil; boş = kapalı)
  fontScale: number;
  reciter: string;
  comments: boolean; // yorum rozetleri/kutuları tamamen kapatılabilir (GOAL gereksinimi)
  notes: boolean;    // kendi yorumlarının hâşiye (el yazısı not) görünümü
  theme: 'acik' | 'koyu';
  arFont: 'hafs' | 'amiri' | 'sheherazade' | 'noto' | 'lateef' | 'ruqaa' | 'husrev';
  frame: 'klasik' | 'zumrut' | 'gul' | 'gece' | 'firuze' | 'sade';
};

export const DEFAULT_SETTINGS: Settings = {
  mode: 'renkli',
  wordLangs: ['tr', 'en'],
  meals: ['tr'],
  fontScale: 1,
  reciter: 'Husary_64kbps',
  comments: true,
  notes: true,
  theme: 'acik',
  arFont: 'hafs',
  frame: 'klasik',
};

// Eski kayıt biçiminden (wordTr/wordEn/meal) göç
function migrate(saved: Record<string, unknown>): Partial<Settings> {
  const out: Partial<Settings> = { ...saved } as Partial<Settings>;
  if (!Array.isArray(saved.wordLangs) && ('wordTr' in saved || 'wordEn' in saved)) {
    out.wordLangs = [
      ...(saved.wordTr !== false ? ['tr'] : []),
      ...(saved.wordEn !== false ? ['en'] : []),
    ];
  }
  if (!Array.isArray(saved.meals) && typeof saved.meal === 'string') {
    out.meals = saved.meal === 'iki' ? ['tr', 'en'] : saved.meal === 'kapali' ? [] : [saved.meal];
  }
  return out;
}

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
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...migrate(JSON.parse(saved)) });
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
