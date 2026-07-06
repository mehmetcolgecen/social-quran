'use client';
// İlim/tefekkür hâşiyesi — ayetteki bilimsel işarete dair el yazısı kenar notu.
// Kişisel yorum üslubunda, ayetten alıntıyla; ayarlardaki "🔬 İlim notları" ile kapatılabilir.
import { MUCIZELER } from '@/lib/mucizeler';
import { useSettings } from '@/lib/settings';

export default function MiracleNote({ verseKey }: { verseKey: string }) {
  const { settings } = useSettings();
  const m = MUCIZELER[verseKey];
  if (!m || !settings.science) return null;
  return (
    <div className="mynotes science">
      <span className="mynote static">
        <svg className="mynote-arrow" viewBox="0 0 44 34" aria-hidden="true">
          <path d="M4 30 C 12 22, 24 14, 38 7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeDasharray="5 4" strokeLinecap="round" />
          <path d="M30 4 L39 6 L36 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="mynote-text">
          <b>🔬 İlim notu</b> — <q>❝{m.quote}❞</q><br />{m.note}
        </span>
      </span>
    </div>
  );
}
