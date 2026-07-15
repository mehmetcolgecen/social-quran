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

// ---- Unvan bantlarından (SurahBanner) alınan motif yardımcıları ----
// Sekiz kollu yıldız: 45° döndürülmüş iki kare (Karatay geçmesi)
function star8(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  for (const a of [0, Math.PI / 4]) {
    ctx.save(); ctx.rotate(a); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
  }
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
}

// Yanları yarım daire biten kartuş yolu (bantlardaki unvan kartuşu gibi)
function cartouchePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
}

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
      const topPad = 268; // kartuşun altından Arapça metnin ilk satırına
      const H = Math.max(680, Math.round(
        topPad + arLines.length * arLineH + 24 + 56 + mealLines.length * (mealSize * 1.45) + 165,
      ));
      canvas.height = H; // boyut ataması tuvali sıfırlar → aşağıda baştan çizilir

      // Zemin: yaldız kenar → lacivert desen bandı → çift çerçeveli krem panel
      // (unvan bantlarının paleti: rumi laciverti, altın, kırmızı göbek, krem)
      const gold = ctx.createLinearGradient(0, 0, W, H);
      gold.addColorStop(0, '#b8860b'); gold.addColorStop(.3, '#f3d876');
      gold.addColorStop(.6, '#a97e12'); gold.addColorStop(1, '#e8c95a');
      ctx.fillStyle = gold;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#16324f';
      ctx.fillRect(20, 20, W - 40, H - 40);
      // bantta sekiz kollu yıldız dizisi + kırmızı göbekler (Karatay geçmesi esintisi)
      for (let x = 52; x < W - 36; x += 64) {
        for (const y of [52, H - 52]) {
          star8(ctx, x, y, 10, '#e8c95a');
          ctx.fillStyle = '#c73a2a';
          ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (let y = 116; y < H - 84; y += 64) {
        for (const x of [52, W - 52]) star8(ctx, x, y, 8, '#e8c95a');
      }
      ctx.fillStyle = '#fbf6e9';
      ctx.fillRect(84, 84, W - 168, H - 168);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      ctx.strokeRect(96, 96, W - 192, H - 192);
      ctx.strokeStyle = 'rgba(138, 106, 28, .5)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(105, 105, W - 210, H - 210);

      // Üst kartuş: sure adı + ayet anahtarı, iki yanda kırmızı baklava (bantlardaki gibi)
      const cW = Math.min(640, W - 360);
      const cH = 66;
      const cY = 140;
      cartouchePath(ctx, W / 2 - cW / 2, cY - cH / 2, cW, cH);
      ctx.fillStyle = '#f2ead4'; ctx.fill();
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3; ctx.stroke();
      cartouchePath(ctx, W / 2 - cW / 2 + 7, cY - cH / 2 + 7, cW - 14, cH - 14);
      ctx.strokeStyle = 'rgba(138, 106, 28, .6)'; ctx.lineWidth = 1.2; ctx.stroke();
      diamond(ctx, W / 2 - cW / 2 - 28, cY, 13, '#c73a2a', '#7d5f0e');
      diamond(ctx, W / 2 + cW / 2 + 28, cY, 13, '#c73a2a', '#7d5f0e');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#6d5312';
      ctx.font = '600 30px system-ui, sans-serif';
      ctx.fillText(`${surahName} Suresi · ${verseKey}`, W / 2, cY + 10);

      // Arapça metin (RTL, sarmalı, ortalı)
      ctx.direction = 'rtl';
      ctx.fillStyle = '#1c1a16';
      let y = topPad;
      ctx.font = `${arSize}px ${arFamily}`;
      for (const line of arLines) {
        ctx.fillText(line, W / 2, y);
        y += arLineH;
      }
      // Ayraç: iki yana altın çizgi, ortada baklava
      y += 24;
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 115, y); ctx.lineTo(W / 2 - 18, y);
      ctx.moveTo(W / 2 + 18, y); ctx.lineTo(W / 2 + 115, y);
      ctx.stroke();
      diamond(ctx, W / 2, y, 9, '#e8c95a', '#7d5f0e');
      y += 56;

      ctx.direction = 'ltr';
      ctx.fillStyle = '#46413a';
      ctx.font = `${mealSize}px system-ui, sans-serif`;
      for (const line of mealLines) {
        ctx.fillText(line, W / 2, y);
        y += mealSize * 1.45;
      }

      ctx.fillStyle = '#a89e86';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('sosyal-kuran.com', W / 2, H - 132);
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
        {/* Tezhipli kart minyatürü: çift çerçeve + sekiz kollu yıldız (kartın kendisi gibi) */}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="2.6" y="3.6" width="18.8" height="16.8" rx="2.4"
            fill="none" stroke="currentColor" strokeWidth="1.7" />
          <rect x="5.4" y="6.4" width="13.2" height="11.2"
            fill="none" stroke="currentColor" strokeWidth=".9" opacity=".55" />
          <g transform="translate(12 12)" fill="currentColor">
            <rect x="-2.5" y="-2.5" width="5" height="5" />
            <rect x="-2.5" y="-2.5" width="5" height="5" transform="rotate(45)" />
          </g>
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
