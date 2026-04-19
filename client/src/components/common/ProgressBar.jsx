import '../../styles/components/progressbar.css';

export default function ProgressBar({ value, max, color, label, showPercent = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label-row">
          <span className="progress-label">{label}</span>
          {showPercent && <span className="progress-pct">{pct}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: color || 'var(--color-primary)',
          }}
        />
      </div>
    </div>
  );
}
