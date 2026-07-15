'use client';
// Arayüz kromu (menüler, ayar çubuğu, oynatıcı, yorum kutuları…) için iki dilli sözlük.
// İçerik dilleri (meal/kelime anlamı) ayrıdır ve ayarlar çubuğundan yönetilir;
// bu sözlük yalnız arayüz etiketlerini çevirir. Kullanım: const t = useT(); t('learn')
import { createElement } from 'react';
import { useSettings } from '@/lib/settings';

export type UiLang = 'tr' | 'en';

const UI = {
  // Üst bar
  menu: { tr: 'Menü', en: 'Menu' },
  surahs: { tr: 'Sureler', en: 'Surahs' },
  learn: { tr: 'Öğren', en: 'Learn' },
  truths: { tr: 'Hakikatler', en: 'Scientific Signs' },
  truthsTitle: { tr: 'Bilimsel hakikatler', en: 'Scientific signs in verses' },
  bookmarks: { tr: 'Yer imleri', en: 'Bookmarks' },
  plan: { tr: 'Plan', en: 'Plan' },
  searchPh: { tr: '🔍 Sure, ayet, kelime ara…', en: '🔍 Search surah, verse, word…' },
  searchLabel: { tr: 'Ara', en: 'Search' },
  signIn: { tr: 'Giriş yap', en: 'Sign in' },
  signOut: { tr: 'Çıkış', en: 'Sign out' },
  themeToDark: { tr: 'Koyu temaya geç', en: 'Switch to dark theme' },
  themeToLight: { tr: 'Açık temaya geç', en: 'Switch to light theme' },
  langLabel: { tr: 'Arayüz dili', en: 'Interface language' },
  // Ayar çubuğu
  mode: { tr: 'Mod', en: 'Mode' },
  modeColor: { tr: 'Renkli', en: 'Colored' },
  modeBlack: { tr: 'Siyah', en: 'Black' },
  modeMahrec: { tr: 'Mahreç', en: 'Articulation' },
  word: { tr: 'Kelime', en: 'Word' },
  meal: { tr: 'Meal', en: 'Translation' },
  off: { tr: 'Kapalı', en: 'Off' },
  size: { tr: 'Boyut', en: 'Size' },
  sizeS: { tr: 'Küçük', en: 'Small' },
  sizeM: { tr: 'Normal', en: 'Normal' },
  sizeL: { tr: 'Büyük', en: 'Large' },
  sizeXL: { tr: 'Çok büyük', en: 'Extra large' },
  font: { tr: 'Yazı', en: 'Font' },
  frame: { tr: 'Desen', en: 'Pattern' },
  frameKlasik: { tr: 'Klasik (lacivert)', en: 'Classic (navy)' },
  frameZumrut: { tr: 'Zümrüt', en: 'Emerald' },
  frameGul: { tr: 'Gül kurusu', en: 'Rose' },
  frameGece: { tr: 'Gece', en: 'Night' },
  frameFiruze: { tr: 'Firuze', en: 'Turquoise' },
  frameSade: { tr: 'Sade altın', en: 'Plain gold' },
  reciter: { tr: 'Kâri', en: 'Reciter' },
  wordTiming: { tr: 'kelime takibi', en: 'word tracking' },
  comments: { tr: 'Yorumlar', en: 'Comments' },
  notes: { tr: '📝 Notlar', en: '📝 Notes' },
  science: { tr: '🔬 İlim', en: '🔬 Insights' },
  listen: { tr: '▶ Dinle', en: '▶ Listen' },
  stop: { tr: '⏹ Durdur', en: '⏹ Stop' },
  // Oynatıcı
  prevAyah: { tr: 'Önceki ayet', en: 'Previous verse' },
  nextAyah: { tr: 'Sonraki ayet', en: 'Next verse' },
  pause: { tr: 'Duraklat', en: 'Pause' },
  resume: { tr: 'Devam', en: 'Resume' },
  repeat: { tr: 'Tekrar', en: 'Repeat' },
  speed: { tr: 'Hız', en: 'Speed' },
  close: { tr: 'Kapat', en: 'Close' },
  // Görünüm geçişleri + sayfa
  toPageView: { tr: '🕮 Sayfa görünümüne geç', en: '🕮 Switch to page view' },
  toSurahView: { tr: '☰ Sure görünümüne geç', en: '☰ Switch to surah view' },
  pageRead: { tr: '✅ Okundu', en: '✅ Read' },
  pageMarkRead: { tr: '☑ Bu sayfayı okudum', en: '☑ Mark page as read' },
  todayPages: { tr: 'Bugün', en: 'Today' },
  page: { tr: 'Sayfa', en: 'Page' },
  ayahs: { tr: 'ayet', en: 'verses' },
  // Ezber listesi
  memorizeTitlePage: { tr: 'Sayfanın kelimeleri', en: 'Words on this page' },
  memorizeTitleSurah: { tr: 'Surenin kelimeleri', en: 'Words in this surah' },
  memorizeHint: { tr: 'benzersiz kelime — ezberlediklerine tik at!', en: 'unique words — tick the ones you know!' },
  memorizeTotal: { tr: 'Toplam ezberin', en: 'Total memorized' },
  wordsUnit: { tr: 'kelime', en: 'words' },
  mot0: { tr: '🌱 Hadi başlayalım! İlk kelimeni ezberle.', en: '🌱 Let’s begin! Memorize your first word.' },
  motHalf: { tr: '💪 Harika gidiyorsun!', en: '💪 You’re doing great!' },
  motNear: { tr: '✨ Az kaldı! Sadece', en: '✨ Almost there! Only' },
  motLeft: { tr: 'kelime kaldı.', en: 'words left.' },
  motDone: { tr: '🌟 Mâşâallah! Buradaki tüm kelimeler ezberinde.', en: '🌟 Mashallah! You know every word here.' },
  // Kelime popover + yorum katmanı
  listenWord: { tr: '▶ Dinle', en: '▶ Listen' },
  comment: { tr: '💬 Yorum', en: '💬 Comment' },
  commentsOf: { tr: 'yorumları', en: 'comments' },
  surahSuffix: { tr: 'Suresi', en: 'Surah' },
  pageComments: { tr: 'Sayfadaki ayet & kelime yorumları', en: 'Verse & word comments on this page' },
  verseOf: { tr: 'ayeti', en: 'verse' },
  commentCount: { tr: 'yorum', en: 'comments' },
  tabAyah: { tr: 'Ayet', en: 'Verse' },
  tabWords: { tr: 'Kelimeler', en: 'Words' },
  noAyahComments: { tr: 'Henüz ayet yorumu yok — ilk yorumu siz yazın.', en: 'No verse comments yet — be the first.' },
  noWordComments: { tr: 'Henüz kelime yorumu yok — aşağıdan kelime seçip ilk yorumu yazın.', en: 'No word comments yet — pick a word below and write the first.' },
  noComments: { tr: 'Henüz yorum yok — ilk yorumu siz yazın.', en: 'No comments yet — be the first.' },
  loading: { tr: 'Yükleniyor…', en: 'Loading…' },
  targetWord: { tr: 'Hedef kelime:', en: 'Target word:' },
  nthWord: { tr: '. kelime', en: 'th word' },
  writePh: { tr: 'Yorumunuz… (Ctrl+Enter ile gönder)', en: 'Your comment… (Ctrl+Enter to send)' },
  send: { tr: 'Gönder', en: 'Send' },
  visPublic: { tr: '🌍 Herkese açık', en: '🌍 Public' },
  visPrivate: { tr: '🔒 Özel (yalnızca ben)', en: '🔒 Private (only me)' },
  visPrivateShort: { tr: '🔒 Özel', en: '🔒 Private' },
  visPublicShort: { tr: '🌍 Herkese açık', en: '🌍 Public' },
  loginToComment: { tr: 'Yorum yazmak için giriş yapın →', en: 'Sign in to comment →' },
  loginToNote: { tr: 'Not düşmek için giriş yapın →', en: 'Sign in to add a note →' },
  noteTo: { tr: 'ayetine not', en: 'add note to verse' },
  notePh: { tr: 'Hâşiyenizi yazın… (Ctrl+Enter kaydeder, Esc kapatır)', en: 'Write your note… (Ctrl+Enter saves, Esc closes)' },
  save: { tr: 'Kaydet', en: 'Save' },
  noteFailed: { tr: 'Not kaydedilemedi', en: 'Could not save note' },
  railHint: { tr: 'Boşluğa tıkla → bu ayete not düş', en: 'Click empty space → add a note to this verse' },
  noteDragHint: { tr: 'Sürükleyerek taşı · köşeden boyutlandır', en: 'Drag to move · resize from corner' },
  noteOpenHint: { tr: 'tıklayınca yorumu açar', en: 'click to open the comment' },
  noteMin: { tr: 'Kutuyu gizle', en: 'Hide box' },
  noteMax: { tr: 'Notu göster', en: 'Show note' },
  // Paylaşım kartı
  sharePngDownload: { tr: '⬇ PNG indir', en: '⬇ Download PNG' },
  shareCopy: { tr: '📋 Kopyala', en: '📋 Copy' },
  shareCopied: { tr: '✓ Kopyalandı', en: '✓ Copied' },
  shareCardTitle: { tr: 'Ayet kartı oluştur', en: 'Create verse card' },
} as const;

export type UiKey = keyof typeof UI;
export const t = (lang: UiLang, key: UiKey): string => UI[key][lang];

// Client bileşenlerde: const t = useT(); t('learn')
export function useT() {
  const { settings } = useSettings();
  return (key: UiKey) => UI[key][settings.uiLang];
}

// Server bileşenlerin içinde tek etiket çevirmek için küçük client adacığı:
// <Tt k="toPageView" />
export function Tt({ k }: { k: UiKey }) {
  const { settings } = useSettings();
  return createElement('span', null, UI[k][settings.uiLang]);
}
