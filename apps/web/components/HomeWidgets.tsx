'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BOOKMARKS_KEY, loadJSON, onStoreChange, type Bookmark } from '@/lib/store';
import { loadPlan, planStats } from '@/lib/plan';

export default function HomeWidgets() {
  const [plan, setPlan] = useState<{ today: number; goal: number; streak: number; pct: number } | null>(null);
  const [marks, setMarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const p = loadPlan();
    const s = planStats(p);
    setPlan({ today: s.todayCount, goal: p.goal, streak: s.streak, pct: s.pct });
    const loadMarks = () => setMarks(loadJSON<Bookmark[]>(BOOKMARKS_KEY, []).slice(0, 3));
    loadMarks();
    return onStoreChange(BOOKMARKS_KEY, loadMarks);
  }, []);

  return (
    <div className="home-widgets">
      {plan && (
        <Link className="continue-card" href="/plan">
          📅 Bugün {plan.today}/{plan.goal} sayfa{plan.streak > 0 && <> · 🔥 {plan.streak} gün</>} · Hatim %{plan.pct}
        </Link>
      )}
      {marks.map((b) => (
        <Link key={`${b.surah}:${b.ayah}`} className="continue-card" href={`/sure/${b.surah}#ayet-${b.surah}-${b.ayah}`}>
          🔖 {b.name} {b.surah}:{b.ayah}
        </Link>
      ))}
    </div>
  );
}
