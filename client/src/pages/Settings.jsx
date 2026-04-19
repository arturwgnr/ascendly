import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../api/client';
import '../styles/components/settings.css';

const DEFAULT_THEME = {
  primary:   '#7c6cf2',
  secondary: '#3ecfcf',
  accent:    '#f2a96c',
  bg:        '#0e0e14',
};

function applyTheme(overrides) {
  const map = {
    primary:   '--color-primary',
    secondary: '--color-secondary',
    accent:    '--color-accent',
    bg:        '--color-bg',
  };
  Object.entries(overrides).forEach(([k, v]) => {
    if (map[k] && v) document.documentElement.style.setProperty(map[k], v);
  });
}

export default function Settings() {
  const [pillars, setPillars] = useState([]);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setPillars(data.pillars.map(p => ({ ...p })));
      if (data.settings?.themeOverrides) {
        setTheme({ ...DEFAULT_THEME, ...data.settings.themeOverrides });
      }
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

  function updateTheme(key, value) {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        api.put('/growth/pillars', { pillars: pillars.filter(p => p.label.trim()) }),
        api.put('/settings', { themeOverrides: theme }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function resetTheme() {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  }

  if (loading) return <Layout title="Settings"><div className="empty-state"><p>Loading…</p></div></Layout>;

  return (
    <Layout title="Settings">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Customize your missions, theme, and preferences.</div>
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

        {/* Theme */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 600 }}>Theme Colors</span>
            <button className="btn btn-ghost btn-sm" onClick={resetTheme}>Reset</button>
          </div>
          <div className="theme-swatches">
            {[
              { key: 'primary',   label: 'Primary'   },
              { key: 'secondary', label: 'Secondary' },
              { key: 'accent',    label: 'Accent'    },
              { key: 'bg',        label: 'Background' },
            ].map(({ key, label }) => (
              <div key={key} className="swatch-row">
                <span className="swatch-label">{label}</span>
                <input
                  className="color-input"
                  type="color"
                  value={theme[key] || DEFAULT_THEME[key]}
                  onChange={e => updateTheme(key, e.target.value)}
                />
                <span className="color-hex">{theme[key]}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: 14 }}>
            Changes preview in real-time. Save to persist across sessions.
          </p>
        </div>

      </div>
    </Layout>
  );
}
