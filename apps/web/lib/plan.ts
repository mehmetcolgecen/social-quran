// Okuma planı hesapları (client) — sayfa işaretleri localStorage'da (lib/store PLAN_KEY).
import { loadJSON, PLAN_KEY, todayStr, type ReadingPlan } from './store';

export const DEFAULT_PLAN: ReadingPlan = { goal: 20, read: {} };

export function loadPlan(): ReadingPlan {
  const p = loadJSON<ReadingPlan>(PLAN_KEY, DEFAULT_PLAN);
  return { ...DEFAULT_PLAN, ...p };
}

export function planStats(plan: ReadingPlan) {
  const dayCounts = new Map<string, number>();
  for (const date of Object.values(plan.read)) {
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
  }
  const today = todayStr();
  const todayCount = dayCounts.get(today) ?? 0;
  const total = Object.keys(plan.read).length;

  // Seri: bugünden (veya hedef henüz dolmadıysa dünden) geriye, hedefi tutturan ardışık günler
  let streak = 0;
  const day = new Date();
  if (todayCount >= plan.goal) streak++;
  for (let i = 1; i <= 365; i++) {
    day.setDate(day.getDate() - 1);
    if ((dayCounts.get(day.toISOString().slice(0, 10)) ?? 0) >= plan.goal) streak++;
    else break;
  }

  return {
    todayCount,
    total,
    pct: Math.round((total / 604) * 100),
    streak,
    remainingDays: plan.goal > 0 ? Math.ceil((604 - total) / plan.goal) : null,
  };
}
