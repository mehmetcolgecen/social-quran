'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onStoreChange, PLAN_KEY, saveJSON, type ReadingPlan } from '@/lib/store';
import { loadPlan, planStats } from '@/lib/plan';

export default function PlanPage() {
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  useEffect(() => {
    const load = () => setPlan(loadPlan());
    load();
    return onStoreChange(PLAN_KEY, load);
  }, []);

  if (!plan) return <main><p className="cmuted">Yükleniyor…</p></main>;
  const stats = planStats(plan);
  const recent = Object.entries(plan.read).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 12);

  return (
    <main>
      <h1>📅 Okuma planım</h1>
      <div className="plan-cards">
        <div className="plan-card">
          <b>Bugün</b>
          <span className="plan-big">{stats.todayCount}<small>/{plan.goal}</small></span>
          <div className="mem-progress"><div className="mem-bar" style={{ width: `${Math.min(100, (stats.todayCount / plan.goal) * 100)}%` }} /></div>
        </div>
        <div className="plan-card">
          <b>Seri</b>
          <span className="plan-big">🔥 {stats.streak}<small> gün</small></span>
          <span className="cmuted">{stats.todayCount >= plan.goal ? 'Bugünkü hedef tamam!' : `${plan.goal - stats.todayCount} sayfa kaldı`}</span>
        </div>
        <div className="plan-card">
          <b>Hatim ilerlemesi</b>
          <span className="plan-big">%{stats.pct}<small> ({stats.total}/604)</small></span>
          <div className="mem-progress"><div className="mem-bar" style={{ width: `${stats.pct}%` }} /></div>
          {stats.remainingDays !== null && stats.total < 604 && (
            <span className="cmuted">Bu hızla ~{stats.remainingDays} günde biter</span>
          )}
          {stats.total >= 604 && <span className="mem-motivation">🌟 Hatim tamam — mâşâallah!</span>}
        </div>
      </div>
      <p>
        Günlük hedef:{' '}
        <select value={plan.goal} onChange={(e) => saveJSON(PLAN_KEY, { ...plan, goal: Number(e.target.value) })}>
          <option value={5}>5 sayfa (rahat)</option>
          <option value={10}>10 sayfa</option>
          <option value={20}>20 sayfa (1 cüz — 30 günde hatim)</option>
          <option value={40}>40 sayfa (2 cüz)</option>
        </select>
      </p>
      <p className="cmuted">Sayfa görünümünde "☑ Bu sayfayı okudum" düğmesiyle işaretleyin.</p>
      {recent.length > 0 && (
        <>
          <h2>Son okunan sayfalar</h2>
          <div className="target-buttons">
            {recent.map(([page, date]) => (
              <Link key={page} className="view-toggle" href={`/sayfa/${page}`}>Sayfa {page} · {date.slice(5)}</Link>
            ))}
          </div>
        </>
      )}
      {stats.total > 0 && (
        <p><button className="view-toggle" style={{ cursor: 'pointer' }}
          onClick={() => { if (confirm('Tüm okuma kaydı silinsin mi?')) saveJSON(PLAN_KEY, { goal: plan.goal, read: {} }); }}>
          Planı sıfırla
        </button></p>
      )}
    </main>
  );
}
