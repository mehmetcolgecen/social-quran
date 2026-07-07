'use client';
// Ayet paylaşım kartı — canvas'ta yaldızlı çerçeveli görsel üretir (PNG indir / panoya kopyala).
// Arapça metin seçili mushaf fontuyla, RTL sarmalı çizilir; kart yüksekliği içeriğe göre daralır.
// Modal, .ayah'ın paint-containment'ından etkilenmemesi için portal ile body'ye açılır.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/lib/i18n';

type Props = {
  verseKey: string;
  surahName: string;
  words: { p: number; ar: string }[];
  mealTr: string;
};

const W = 1080;

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
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Esc ile kapanma
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      await document.fonts.ready;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      // CSS var yerine gerçek bir elementin çözümlenmiş font ailesi (canvas'ın anlayacağı biçim)
      const arEl = document.querySelector('.w .ar, .basmala, .surah-card .ar');
      const arFamily = arEl ? getComputedStyle(arEl).fontFamily : 'serif';
      await document.fonts.load(`64px ${arFamily.split(',')[0]}`).catch(() => { /* fallback serif */ });

      // Önce içerik ölçülür, kart yüksekliği içeriğe göre belirlenir (dev boş kart olmasın)
      canvas.width = W;
      const arText = words.map((w) => w.ar).join(' ');
      let arSize = 62;
      ctx.font = `${arSize}px ${arFamily}`;
      let arLines = wrap(ctx, arText, W - 280);
      while (arLines.length > 8 && arSize > 34) {
        arSize -= 6;
        ctx.font = `${arSize}px ${arFamily}`;
        arLines = wrap(ctx, arText, W - 280);
      }
      const arLineH = arSize * 1.8;
      const mealSize = 30;
      ctx.font = `${mealSize}px system-ui, sans-serif`;
      const mealLines = wrap(ctx, mealTr, W - 300).slice(0, 7);
      const topPad = 165;
      const H = Math.max(620, Math.round(
        topPad + arLines.length * arLineH + 24 + 56 + mealLines.length * (mealSize * 1.45) + 60 + 120,
      ));
      canvas.height = H; // boyut ataması tuvali sıfırlar → aşağıda baştan çizilir

      // Zemin + yaldız çerçeve katmanları
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
      let y = topPad;
      ctx.font = `${arSize}px ${arFamily}`;
      for (const line of arLines) {
        ctx.fillText(line, W / 2, y);
        y += arLineH;
      }
      y += 24;
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
      y += 44;
      ctx.fillStyle = '#8a6d1d';
      ctx.font = '600 32px system-ui, sans-serif';
      ctx.fillText(`${surahName} Suresi ${verseKey}`, W / 2, y);

      ctx.fillStyle = '#a89e86';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('sosyal-kuran.com', W / 2, H - 98);
    })();
  }, [open, verseKey, surahName, words, mealTr]);

  const download = () => {
    const a = document.createElement('a');
    a.download = `ayet-${verseKey.replace(':', '-')}.png`;
    a.href = canvasRef.current!.toDataURL('image/png');
    a.click();
  };

  // Kartı panoya PNG olarak kopyalar; pano API'si yoksa indirmeye düşer
  const copy = async () => {
    const canvas = canvasRef.current!;
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      download();
    }
  };

  return (
    <>
      <button className="sharebtn" title={t('shareCardTitle')} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3.5" />
          <path d="M3 16 L8.5 10.5 L13 15 L16 12 L21 17" />
          <circle cx="15.5" cy="7.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open && createPortal(
        <span className="share-modal" dir="ltr" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <span className="share-box">
            <canvas ref={canvasRef} width={W} height={620} />
            <span className="share-actions">
              <button onClick={download}>{t('sharePngDownload')}</button>
              <button onClick={copy}>{copied ? t('shareCopied') : t('shareCopy')}</button>
              <button onClick={() => setOpen(false)}>{t('close')}</button>
            </span>
          </span>
        </span>,
        document.body,
      )}
    </>
  );
}
