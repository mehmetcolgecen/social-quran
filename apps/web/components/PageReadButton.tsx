'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onStoreChange, PLAN_KEY, saveJSON, todayStr } from '@/lib/store';
import { loadPlan, planStats } from '@/lib/plan';
import { useT } from '@/lib/i18n';

export default function PageReadButton({ page }: { page: number }) {
  const t = useT();
  const [state, setState] = useState<{ read: boolean; today: number; goal: number } | null>(null);

  useEffect(() => {
    const load = () => {
      const plan = loadPlan();
      setState({ read: String(page) in plan.read, today: planStats(plan).todayCount, goal: plan.goal });
    };
    load();
    return onStoreChange(PLAN_KEY, load);
  }, [page]);

  if (!state) return null;
  const toggle = () => {
    const plan = loadPlan();
    if (state.read) delete plan.read[String(page)];
    else plan.read[String(page)] = todayStr();
    saveJSON(PLAN_KEY, plan);
  };

  return (
    <span className="page-read">
      <button className={`view-toggle${state.read ? ' done' : ''}`} style={{ cursor: 'pointer' }} onClick={toggle}>
        {state.read ? t('pageRead') : t('pageMarkRead')}
      </button>
      <Link href="/plan" className="cmuted">{t('todayPages')} {state.today}/{state.goal}</Link>
    </span>
  );
}
