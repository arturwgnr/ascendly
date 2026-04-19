import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import Heatmap from '../components/common/Heatmap';
import Modal from '../components/common/Modal';
import api from '../api/client';
import '../styles/components/growth.css';

const TODAY = new Date().toISOString().slice(0, 10);

export default function Growth() {
  const [date, setDate] = useState(TODAY);
  const [dayData, setDayData] = useState(null);
  const [heatmap, setHeatmap] = useState({});
  const [newHabit, setNewHabit] = useState({ label: '', type: 'GOOD' });
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteScore, setNoteScore] = useState(null);
  const [dayType, setDayType] = useState('WORK');
  const [missionsDone, setMissionsDone] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDay = useCallback(async () => {
    const [d, h] = await Promise.all([
      api.get(`/growth/day/${date}`),
      api.get('/growth/heatmap'),
    ]);
    setDayData(d.data);
    setHeatmap(h.data);
    setNoteText(d.data.entry?.noteText || '');
    setNoteScore(d.data.entry?.noteScore || null);
    setDayType(d.data.entry?.dayType || 'WORK');
    setMissionsDone(d.data.entry?.missionsDone || []);
  }, [date]);

  useEffect(() => { loadDay().finally(() => setLoading(false)); }, [loadDay]);

  async function saveDay() {
    setSaving(true);
    await api.put(`/growth/day/${date}`, { dayType, noteScore, noteText, missionsDone });
    setSaving(false);
  }

  function toggleMission(id) {
    setMissionsDone(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function toggleHabit(habitId) {
    await api.post(`/growth/habits/${habitId}/log`, { date });
    loadDay();
  }

  async function createHabit(e) {
    e.preventDefault();
    await api.post('/growth/habits', newHabit);
    setShowHabitModal(false);
    setNewHabit({ label: '', type: 'GOOD' });
    loadDay();
  }

  async function deleteHabit(id) {
    if (!confirm('Delete this habit?')) return;
    await api.delete(`/growth/habits/${id}`);
    loadDay();
  }

  const { entry, habits = [], logs = [], pillars = [] } = dayData || {};
  const loggedIds = new Set(logs.map(l => l.habitId));
  const goodHabits = habits.filter(h => h.type === 'GOOD' && !h.isArchived);
  const badHabits = habits.filter(h => h.type === 'BAD' && !h.isArchived);

  if (loading) return <Layout title="Growth"><div className="empty-state"><p>Loading…</p></div></Layout>;

  return (
    <Layout title="Growth">
      <div className="page-header">
        <div>
          <div className="page-title">Personal Growth</div>
          <div className="page-subtitle">Missions, habits, and your daily reflection.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: 150 }}
          />
          <button className="btn btn-primary" onClick={saveDay} disabled={saving}>
            {saving ? 'Saving…' : 'Save Day'}
          </button>
        </div>
      </div>

      <div className="growth-grid">
        <div className="growth-main">

          {/* Day Type */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Day Type</div>
            <div className="day-type-toggle">
              <button
                className={`day-type-btn${dayType === 'WORK' ? ' active-work' : ''}`}
                onClick={() => setDayType('WORK')}
              >Work Day</button>
              <button
                className={`day-type-btn${dayType === 'OFF' ? ' active-off' : ''}`}
                onClick={() => setDayType('OFF')}
              >Day Off</button>
            </div>
          </div>

          {/* Missions */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Missions</div>
            {pillars.length === 0 ? (
              <div className="empty-state"><p>Configure missions in Settings.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pillars.map(p => {
                  const done = missionsDone.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`mission-row${done ? ' done' : ''}`}
                      onClick={() => toggleMission(p.id)}
                    >
                      <div className="mission-check">{done ? '✓' : ''}</div>
                      <span>{p.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Habits */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 600 }}>Habits</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHabitModal(true)}>+ Add Habit</button>
            </div>

            {goodHabits.length > 0 && (
              <div className="habits-section" style={{ marginBottom: 12 }}>
                <div className="habits-section-label">Good Habits</div>
                {goodHabits.map(h => (
                  <div key={h.id} className="habit-row good">
                    <button
                      className={`habit-check-btn${loggedIds.has(h.id) ? ' logged' : ''}`}
                      onClick={() => toggleHabit(h.id)}
                    >✓</button>
                    <span className="habit-label">{h.label}</span>
                    {loggedIds.has(h.id) && (
                      <span className="tag tag-success" style={{ fontSize: '0.68rem' }}>Done</span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ opacity: 0.4, fontSize: '0.7rem' }}
                      onClick={() => deleteHabit(h.id)}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {badHabits.length > 0 && (
              <div className="habits-section">
                <div className="habits-section-label">Avoid</div>
                {badHabits.map(h => (
                  <div key={h.id} className="habit-row bad">
                    <button
                      className={`habit-check-btn${loggedIds.has(h.id) ? ' logged' : ''}`}
                      onClick={() => toggleHabit(h.id)}
                    >✓</button>
                    <span className="habit-label">{h.label}</span>
                    {loggedIds.has(h.id) && (
                      <span className="tag tag-danger" style={{ fontSize: '0.68rem' }}>Logged</span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ opacity: 0.4, fontSize: '0.7rem' }}
                      onClick={() => deleteHabit(h.id)}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {habits.filter(h => !h.isArchived).length === 0 && (
              <div className="empty-state"><span>◈</span><p>Add habits to track daily.</p></div>
            )}
          </div>

          {/* Heatmap */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Day Heatmap</div>
            <Heatmap data={Object.fromEntries(Object.entries(heatmap).map(([k, v]) => [k, v.noteScore || 0]))} label="score" max={5} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="growth-sidebar">

          {/* Day Note */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Day Reflection</div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="label">Score (1–5)</label>
              <div className="score-picker">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`score-btn${noteScore === n ? ' active' : ''}`}
                    onClick={() => setNoteScore(n)}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="label">Note</label>
              <textarea
                className="input"
                rows={4}
                placeholder="How was your day?"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

        </div>
      </div>

      {showHabitModal && (
        <Modal
          title="Add Habit"
          onClose={() => setShowHabitModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowHabitModal(false)}>Cancel</button>
              <button className="btn btn-primary" form="habit-form" type="submit">Add</button>
            </>
          }
        >
          <form id="habit-form" onSubmit={createHabit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="label">Habit Name</label>
              <input
                className="input"
                placeholder="e.g. Morning run"
                value={newHabit.label}
                onChange={e => setNewHabit(h => ({ ...h, label: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label className="label">Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['GOOD', 'BAD'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`btn ${newHabit.type === t ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setNewHabit(h => ({ ...h, type: t }))}
                  >
                    {t === 'GOOD' ? 'Good Habit' : 'Avoid'}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
