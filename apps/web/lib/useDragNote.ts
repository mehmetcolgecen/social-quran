'use client';
// Hâşiye kutularını sürükleyerek konumlandırma — konum localStorage'da not bazında saklanır.
// Küçük hareketler tıklama sayılır (kutu tıklanınca yorum açma davranışı bozulmaz).
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const KEY = 'sk-note-pos';
type Pos = { x: number; y: number };

function loadAll(): Record<string, Pos> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}

export function useDragNote(id: string) {
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const start = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => { setPos(loadAll()[id] ?? { x: 0, y: 0 }); }, [id]);

  const onPointerDown = (e: ReactPointerEvent) => {
    start.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
    movedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    if (movedRef.current) setPos({ x: start.current.ox + dx, y: start.current.oy + dy });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (movedRef.current) {
      try {
        const all = loadAll();
        all[id] = pos;
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch { /* dolu olabilir */ }
    }
  };

  return {
    style: { transform: `translate(${pos.x}px, ${pos.y}px)` },
    dragged: pos.x !== 0 || pos.y !== 0,
    movedRef, // tıklama işleyicisi: movedRef.current true ise açma
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
