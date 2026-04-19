import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Heatmap from '../components/common/Heatmap';
import ProgressBar from '../components/common/ProgressBar';
import api from '../api/client';
import '../styles/components/dashboard.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/study/heatmap'),
      api.get('/study/metrics'),
    ]).then(([s, h, m]) => {
      setSummary(s.data);
      setHeatmap(h.data);
      setMetrics(m.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="empty-state"><p>Loading…</p></div></Layout>;

  const { today, study, tasks, gamification } = summary || {};

  return (
    <Layout title="Dashboard">
      <div className="dashboard-grid">

        {/* ─ Today's Missions ─ */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Today's Missions</span>
            <span className="tag tag-muted">{today?.entry?.missionsDone?.length || 0} / {today?.pillars?.length || 0}</span>
          </div>
          <div className="missions-list">
            {today?.pillars?.length === 0 && (
              <div className="empty-state"><p>No missions set. Configure in Settings.</p></div>
            )}
            {today?.pillars?.map(p => {
              const done = today?.entry?.missionsDone?.includes(p.id);
              return (
                <div key={p.id} className={`mission-item${done ? ' done' : ''}`}>
                  <div className="mission-check">{done ? '✓' : ''}</div>
                  <span>{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─ Gamification ─ */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14 }}>Progress</div>
          <div className="gami-widget">
            <div className="gami-top">
              <div className="gami-streak">
                <span className="gami-streak-val">{gamification?.streak ?? 0}</span>
                <span className="gami-streak-label">day streak</span>
              </div>
              <div className="gami-xp-block">
                <div className="gami-level-label">Level {gamification?.level ?? 1} — {gamification?.xp ?? 0} XP</div>
                <ProgressBar value={gamification?.xp ?? 0} max={Math.pow(gamification?.level ?? 1, 2) * 100} showPercent={false} />
              </div>
            </div>
            <div className="gami-badges">
              {gamification?.badges?.filter(b => b.earned).slice(0, 6).map(b => (
                <div key={b.key} className="gami-badge earned" title={b.label}>
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
              {!gamification?.badges?.some(b => b.earned) && (
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>No badges yet — keep going.</span>
              )}
            </div>
          </div>
        </div>

        {/* ─ Study This Week ─ */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14 }}>Study This Week</div>
          <div className="summary-row" style={{ marginBottom: 16 }}>
            <div className="summary-stat">
              <span className="summary-stat-value" style={{ color: 'var(--color-primary)' }}>
                {study?.weeklyTotal ?? 0}h
              </span>
              <span className="summary-stat-label">Total Hours</span>
            </div>
            <div className="summary-stat">
              <span className="summary-stat-value" style={{ color: 'var(--color-secondary)' }}>
                {metrics?.weeklyAvg ?? 0}h
              </span>
              <span className="summary-stat-label">Daily Avg</span>
            </div>
          </div>
          {metrics?.goal && (
            <ProgressBar
              value={metrics.monthlyTotal}
              max={metrics.goal.targetHours}
              label={`Month goal: ${metrics.monthlyTotal}h / ${metrics.goal.targetHours}h`}
            />
          )}
        </div>

        {/* ─ Today's Tasks ─ */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 14 }}>Today's Tasks</div>
          {tasks?.length === 0 && (
            <div className="empty-state">
              <span>▦</span>
              <p>No tasks allocated today.</p>
            </div>
          )}
          <div className="today-tasks">
            {tasks?.map(t => (
              <div key={t.id} className={`today-task-item${t.status === 'DONE' ? ' done' : ''}`}>
                <div className={`priority-dot ${t.priority}`} />
                <span>{t.title}</span>
                {t.status === 'DONE' && <span className="tag tag-success" style={{ marginLeft: 'auto' }}>Done</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ─ Study Heatmap ─ */}
        <div className="card dashboard-wide">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 16 }}>Study Activity</div>
          <Heatmap data={heatmap} label="hours" />
        </div>

      </div>
    </Layout>
  );
}
