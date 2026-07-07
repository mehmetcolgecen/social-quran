'use client';
// Hâşiye kutuları: sürükleyerek taşıma + köşeden boyutlandırma + ok ucunu sürükleme
// + kutuyu küçültüp açma. Hepsi localStorage'da not bazında saklanır
// ({x, y, w, tx, ty, min}). Küçük hareketler tıklama sayılır.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

const KEY = 'sk-note-pos';
type Saved = { x: number; y: number; w?: number; tx?: number; ty?: number; min?: boolean };

function loadAll(): Record<string, Saved> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}
function persist(id: string, patch: Partial<Saved>) {
  try {
    const all = loadAll();
    const prev = all[id] ?? { x: 0, y: 0 };
    all[id] = { ...prev, ...patch };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* dolu olabilir */ }
}

// Yeni oluşturulan not için başlangıç konumu kaydet (ray composer'ı kullanır)
export function saveNotePos(id: string, pos: { x: number; y: number }) {
  persist(id, pos);
}

export function useDragNote(id: string) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [w, setW] = useState<number | null>(null);
  const [tip, setTip] = useState({ x: 0, y: 0 }); // ok ucunun varsayılan hedefe göre kayması
  const [minimized, setMin] = useState(false);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const resize = useRef<{ px: number; ow: number } | null>(null);
  const tipDrag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const saved = loadAll()[id];
    setPos({ x: saved?.x ?? 0, y: saved?.y ?? 0 });
    setW(saved?.w ?? null);
    setTip({ x: saved?.tx ?? 0, y: saved?.ty ?? 0 });
    setMin(saved?.min ?? false);
  }, [id]);

  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    movedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    if (movedRef.current) setPos({ x: drag.current.ox + dx, y: drag.current.oy + dy });
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (movedRef.current) persist(id, pos);
  };

  // Boyutlandırma tutamacı (köşe) — yalnız genişlik; yükseklik içerikle akar
  const onResizeDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    const box = (e.currentTarget as HTMLElement).closest('.mynote') as HTMLElement | null;
    resize.current = { px: e.clientX, ow: w ?? box?.getBoundingClientRect().width ?? 240 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: ReactPointerEvent) => {
    if (!resize.current) return;
    e.stopPropagation();
    setW(Math.min(560, Math.max(150, resize.current.ow + (e.clientX - resize.current.px))));
  };
  const onResizeUp = (e: ReactPointerEvent) => {
    if (!resize.current) return;
    e.stopPropagation();
    resize.current = null;
    if (w != null) persist(id, { w: Math.round(w) });
  };

  // Ok ucu tutamacı — okun işaret ettiği nokta sürüklenerek değiştirilir
  const onTipDown = (e: ReactPointerEvent) => {
    e.stopPropagation();
    tipDrag.current = { px: e.clientX, py: e.clientY, ox: tip.x, oy: tip.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onTipMove = (e: ReactPointerEvent) => {
    if (!tipDrag.current) return;
    e.stopPropagation();
    setTip({
      x: Math.max(-600, Math.min(600, tipDrag.current.ox + (e.clientX - tipDrag.current.px))),
      y: Math.max(-600, Math.min(600, tipDrag.current.oy + (e.clientY - tipDrag.current.py))),
    });
  };
  const onTipUp = (e: ReactPointerEvent) => {
    if (!tipDrag.current) return;
    e.stopPropagation();
    tipDrag.current = null;
    setTip((t) => { persist(id, { tx: Math.round(t.x), ty: Math.round(t.y) }); return t; });
  };

  const style: CSSProperties = {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    ...(w != null && !minimized ? { width: `${w}px`, maxWidth: 'none' } : {}),
  };

  return {
    style,
    pos,
    width: w,
    tip,
    minimized,
    setMinimized: (v: boolean) => { setMin(v); persist(id, { min: v }); },
    movedRef, // tıklama işleyicisi: movedRef.current true ise açma
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    resizeHandlers: { onPointerDown: onResizeDown, onPointerMove: onResizeMove, onPointerUp: onResizeUp },
    tipHandlers: { onPointerDown: onTipDown, onPointerMove: onTipMove, onPointerUp: onTipUp },
  };
}
