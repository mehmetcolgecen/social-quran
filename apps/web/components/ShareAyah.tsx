'use client';
// Ayet paylaşım kartı — canvas'ta yaldızlı çerçeveli görsel üretir (PNG indir / paylaş).
// Arapça metin seçili mushaf fontuyla, RTL sarmalı olarak çizilir.
import { useEffect, useRef, useState } from 'react';

type Props = {
  verseKey: string;
  surahName: string;
  words: { p: number; ar: string }[];
  mealTr: string;
};

const W = 1080, H = 1350;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

export default function ShareAyah({ verseKey, surahName, words, mealTr }: Props) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      await document.fonts.ready;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const arFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-ar') || 'serif';

      // Zemin + yaldız çerçeve katmanları
      ctx.fillStyle = '#fbf6e9';
      ctx.fillRect(0, 0, W, H);
      const gold = ctx.createLinearGradient(0, 0, W, H);
      gold.addColorStop(0, '#b8860b'); gold.addColorStop(.3, '#f3d876');
      gold.addColorStop(.6, '#a97e12'); gold.addColorStop(1, '#e8c95a');
      ctx.fillStyle = gold;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1d4e79';
      ctx.fillRect(22, 22, W - 44, H - 44);
      // bant üzerinde altın baklava dizisi
      ctx.save();
      ctx.fillStyle = 'rgba(232, 201, 90, .9)';
      for (let x = 45; x < W - 30; x += 46) {
        for (const y of [45, H - 45]) {
          ctx.beginPath();
          ctx.moveTo(x, y - 11); ctx.lineTo(x + 11, y); ctx.lineTo(x, y + 11); ctx.lineTo(x - 11, y);
          ctx.closePath(); ctx.fill();
        }
      }
      for (let y = 91; y < H - 60; y += 46) {
        for (const x of [45, W - 45]) {
          ctx.beginPath();
          ctx.moveTo(x, y - 11); ctx.lineTo(x + 11, y); ctx.lineTo(x, y + 11); ctx.lineTo(x - 11, y);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
      ctx.fillStyle = '#fbf6e9';
      ctx.fillRect(68, 68, W - 136, H - 136);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, 80, W - 160, H - 160);

      // Arapça metin (RTL, sarmalı, ortalı)
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      ctx.fillStyle = '#1c1a16';
      const arText = words.map((w) => w.ar).join(' ');
      let arSize = 64;
      ctx.font = `${arSize}px ${arFamily}`;
      let arLines = wrap(ctx, arText, W - 260);
      while (arLines.length > 7 && arSize > 34) {
        arSize -= 6;
        ctx.font = `${arSize}px ${arFamily}`;
        arLines = wrap(ctx, arText, W - 260);
      }
      const arLineH = arSize * 1.75;
      const mealSize = 30;
      ctx.font = `${mealSize}px system-ui, sans-serif`;
      const mealLines = wrap(ctx, mealTr, W - 300).slice(0, 6);
      const blockH = arLines.length * arLineH + 70 + mealLines.length * (mealSize * 1.45) + 90;
      let y = Math.max(190, (H - blockH) / 2);

      ctx.font = `${arSize}px ${arFamily}`;
      for (const line of arLines) {
        ctx.fillText(line, W / 2, y);
        y += arLineH;
      }
      y += 26;
      ctx.strokeStyle = '#c9a227';
      ctx.beginPath(); ctx.moveTo(W / 2 - 90, y); ctx.lineTo(W / 2 + 90, y); ctx.stroke();
      y += 56;

      ctx.direction = 'ltr';
      ctx.fillStyle = '#46413a';
      ctx.font = `${mealSize}px system-ui, sans-serif`;
      for (const line of mealLines) {
        ctx.fillText(line, W / 2, y);
        y += mealSize * 1.45;
      }
      y += 42;
      ctx.fillStyle = '#8a6d1d';
      ctx.font = '600 32px system-ui, sans-serif';
      ctx.fillText(`${surahName} Suresi ${verseKey}`, W / 2, y);

      ctx.fillStyle = '#a89e86';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('sosyal-kuran.com', W / 2, H - 108);
    })();
  }, [open, verseKey, surahName, words, mealTr]);

  const download = () => {
    const a = document.createElement('a');
    a.download = `ayet-${verseKey.replace(':', '-')}.png`;
    a.href = canvasRef.current!.toDataURL('image/png');
    a.click();
  };

  const share = async () => {
    const canvas = canvasRef.current!;
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) return;
    const file = new File([blob], `ayet-${verseKey.replace(':', '-')}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `${surahName} ${verseKey}` }).catch(() => { /* vazgeçildi */ });
    } else download();
  };

  return (
    <>
      <button className="sharebtn" title="Ayet kartı oluştur" onClick={() => setOpen(true)}>🖼</button>
      {open && (
        <span className="share-modal" dir="ltr" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <span className="share-box">
            <canvas ref={canvasRef} width={W} height={H} />
            <span className="share-actions">
              <button onClick={download}>⬇ PNG indir</button>
              <button onClick={share}>📤 Paylaş</button>
              <button onClick={() => setOpen(false)}>Kapat</button>
            </span>
          </span>
        </span>
      )}
    </>
  );
}
