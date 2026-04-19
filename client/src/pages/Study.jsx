import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Layout from '../components/layout/Layout';
import Heatmap from '../components/common/Heatmap';
import ProgressBar from '../components/common/ProgressBar';
import Modal from '../components/common/Modal';
import api from '../api/client';
import '../styles/components/study.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const emptyForm = { date: new Date().toISOString().slice(0, 10), topic: '', hours: '', difficulty: 3, note: '' };

export default function Study() {
  const [sessions, setSessions] = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [goal, setGoal] = useState(null);
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editSession, setEditSession] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    return Promise.all([
      api.get('/study/sessions'),
      api.get('/study/heatmap'),
      api.get('/study/metrics'),
      api.get('/study/snapshots'),
      api.get('/study/goal'),
    ]).then(([s, h, m, sn, g]) => {
      setSessions(s.data);
      setHeatmap(h.data);
      setMetrics(m.data);
      setSnapshots(sn.data);
      setGoal(g.data);
      setGoalInput(g.data?.targetHours || '');
    });
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (editSession) {
      await api.put(`/study/sessions/${editSession.id}`, form);
    } else {
      await api.post('/study/sessions', form);
    }
    setShowForm(false);
    setEditSession(null);
    setForm(emptyForm);
    load();
  }

  async function deleteSession(id) {
    if (!confirm('Delete this session?')) return;
    await api.delete(`/study/sessions/${id}`);
    load();
  }

  async function saveGoal() {
    await api.post('/study/goal', { targetHours: parseFloat(goalInput) });
    setEditingGoal(false);
    load();
  }

  function openEdit(s) {
    setForm({ date: s.date.slice(0, 10), topic: s.topic, hours: s.hours, difficulty: s.difficulty, note: s.note || '' });
    setEditSession(s);
    setShowForm(true);
  }

  const chartData = snapshots.slice(0, 6).reverse().map(s => ({
    name: `${MONTHS[s.month - 1]} '${String(s.year).slice(2)}`,
    hours: s.totalHours,
  }));

  if (loading) return <Layout title="Study"><div className="empty-state"><p>Loading…</p></div></Layout>;

  return (
    <Layout title="Study">
      <div className="page-header">
        <div>
          <div className="page-title">Study Tracker</div>
          <div className="page-subtitle">Log sessions, track rhythm, hit your goal.</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditSession(null); setShowForm(true); }}>
          + Log Session
        </button>
      </div>

      <div className="study-grid">
        <div className="study-main">

          {/* Heatmap */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Activity Heatmap</div>
            <Heatmap data={heatmap} label="hours" />
          </div>

          {/* Sessions */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Recent Sessions</div>
            {sessions.length === 0 ? (
              <div className="empty-state"><span>◉</span><p>No sessions yet. Log your first one.</p></div>
            ) : (
              <div className="session-list">
                {sessions.map(s => (
                  <div key={s.id} className="session-item">
                    <div>
                      <div className="session-topic">{s.topic}</div>
                      <div className="session-meta">
                        <span>{new Date(s.date).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>Diff {s.difficulty}/5</span>
                        {s.note && <><span>·</span><span style={{ fontStyle: 'italic' }}>{s.note}</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="session-hours">{s.hours}h</span>
                      <div className="session-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteSession(s.id)}>Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Month History */}
          {chartData.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Month History</div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--color-text)' }}
                      itemStyle={{ color: 'var(--color-primary)' }}
                    />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === chartData.length - 1 ? 'var(--color-primary)' : 'var(--color-heat-2)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="study-sidebar">

          {/* Metrics */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Rhythm</div>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-val" style={{ color: 'var(--color-primary)' }}>{metrics?.weeklyTotal ?? 0}h</div>
                <div className="metric-lbl">This week</div>
              </div>
              <div className="metric-box">
                <div className="metric-val" style={{ color: 'var(--color-secondary)' }}>{metrics?.weeklyAvg ?? 0}h</div>
                <div className="metric-lbl">Daily avg</div>
              </div>
              <div className="metric-box">
                <div className="metric-val" style={{ color: 'var(--color-accent)' }}>{metrics?.monthlyTotal ?? 0}h</div>
                <div className="metric-lbl">This month</div>
              </div>
              <div className="metric-box">
                <div className="metric-val">{metrics?.goalProgress != null ? `${metrics.goalProgress}%` : '—'}</div>
                <div className="metric-lbl">Goal progress</div>
              </div>
            </div>
          </div>

          {/* Monthly Goal */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Monthly Goal</div>
            <div className="goal-section">
              {goal ? (
                <>
                  <ProgressBar
                    value={metrics?.monthlyTotal ?? 0}
                    max={goal.targetHours}
                    label={`${metrics?.monthlyTotal ?? 0}h / ${goal.targetHours}h`}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoal(true)}>
                    Change Goal
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No goal set for this month.</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoal(true)}>Set Goal</button>
                </>
              )}
              {editingGoal && (
                <div className="goal-edit-row">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="e.g. 40"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={saveGoal}>Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoal(false)}>Cancel</button>
                </div>
              )}
            </div>
          </div>

          {/* Top Topics */}
          {snapshots[0]?.topTopics?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Last Month Top Topics</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {snapshots[0].topTopics.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>{t.topic}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{t.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <Modal
          title={editSession ? 'Edit Session' : 'Log Session'}
          onClose={() => { setShowForm(false); setEditSession(null); }}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditSession(null); }}>Cancel</button>
              <button className="btn btn-primary" form="session-form" type="submit">
                {editSession ? 'Save Changes' : 'Log Session'}
              </button>
            </>
          }
        >
          <form id="session-form" className="session-form" onSubmit={handleSubmit}>
            <div className="session-form-row">
              <div className="field">
                <label className="label">Date</label>
                <input className="input" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="label">Hours</label>
                <input className="input" type="number" step="0.25" min="0.25" placeholder="e.g. 2"
                  value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} required />
              </div>
            </div>
            <div className="field">
              <label className="label">Topic</label>
              <input className="input" type="text" placeholder="e.g. React Hooks"
                value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="label">Difficulty (1–5)</label>
              <div className="diff-picker">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`diff-btn${form.difficulty === n ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, difficulty: n }))}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="label">Note (optional)</label>
              <input className="input" type="text" placeholder="Quick note…"
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
