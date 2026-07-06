'use client';
// İlim/tefekkür hâşiyesi — ayetteki bilimsel işarete dair el yazısı kenar notu.
// Varsayılan görünür, sürüklenerek taşınabilir; "🔬 İlim" ayarıyla kapatılabilir.
import { MUCIZELER } from '@/lib/mucizeler';
import { useSettings } from '@/lib/settings';
import { DraggableNote } from './Comments';

export default function MiracleNote({ verseKey }: { verseKey: string }) {
  const { settings } = useSettings();
  const m = MUCIZELER[verseKey];
  if (!m || !settings.science) return null;
  return (
    <div className="mynotes science">
      <DraggableNote id={`m${verseKey}`}>
        <span className="mynote-text">
          <b>🔬 İlim notu</b> — <q>❝{m.quote}❞</q><br />{m.note}
        </span>
      </DraggableNote>
    </div>
  );
}
