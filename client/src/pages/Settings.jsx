import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import '../styles/components/settings.css';

export default function Settings() {
  const [pillars, setPillars] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setPillars(data.pillars.map(p => ({ ...p })));
    }).finally(() => setLoading(false));
  }, []);

  function updatePillar(index, value) {
    setPillars(prev => prev.map((p, i) => i === index ? { ...p, label: value } : p));
  }

  function addPillar() {
    if (pillars.length >= 6) return;
    setPillars(prev => [...prev, { label: '', order: prev.length }]);
  }

  function removePillar(index) {
    setPillars(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/growth/pillars', { pillars: pillars.filter(p => p.label.trim()) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout title="Settings"><div className="empty-state"><p>Loading…</p></div></Layout>;

  return (
    <Layout title="Settings">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Customize your daily missions and preferences.</div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="settings-grid">

        {/* Pillars */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Daily Missions</div>
          <div className="pillar-list">
            {pillars.map((p, i) => (
              <div key={i} className="pillar-row">
                <input
                  className="input"
                  placeholder={`Mission ${i + 1}`}
                  value={p.label}
                  onChange={e => updatePillar(i, e.target.value)}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => removePillar(i)}>✕</button>
              </div>
            ))}
            {pillars.length < 6 && (
              <button className="btn btn-ghost btn-sm" onClick={addPillar} style={{ alignSelf: 'flex-start' }}>
                + Add Mission
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: 12 }}>
            These appear as checkboxes in the Growth module and on your Dashboard each day.
          </p>
        </div>

      </div>
    </Layout>
  );
}
