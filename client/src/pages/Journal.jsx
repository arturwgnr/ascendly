import Layout from '../components/layout/Layout';

export default function Journal() {
  return (
    <Layout title="Journal">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <span style={{ fontSize: '3rem' }}>◳</span>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Journal — Coming Soon</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', maxWidth: 360 }}>
          Time-aware dynamic journaling with AI analysis and a dedicated heatmap. Reserved for the next phase.
        </p>
      </div>
    </Layout>
  );
}
