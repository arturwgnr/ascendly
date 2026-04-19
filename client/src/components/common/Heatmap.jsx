import { useState } from 'react';
import '../../styles/components/heatmap.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getLevel(value, max) {
  if (!value || value === 0) return 0;
  if (value >= max * 0.75) return 4;
  if (value >= max * 0.5) return 3;
  if (value >= max * 0.25) return 2;
  return 1;
}

function buildGrid(year) {
  const cells = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const startPad = start.getDay();
  for (let i = 0; i < startPad; i++) cells.push(null);

  let cur = new Date(start);
  while (cur < end) {
    cells.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export default function Heatmap({ data = {}, year, max, label = 'contributions' }) {
  const [tooltip, setTooltip] = useState(null);
  const y = year || new Date().getFullYear();
  const weeks = buildGrid(y);
  const maxVal = max || Math.max(1, ...Object.values(data));

  const monthLabels = [];
  let lastMonth = -1;

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="heatmap-cell" style={{ opacity: 0 }} />;
              const key = date.toISOString().slice(0, 10);
              const val = data[key] || 0;
              const level = getLevel(val, maxVal);
              return (
                <div
                  key={di}
                  className="heatmap-cell"
                  data-level={level}
                  title={`${key}: ${val} ${label}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-legend-cells">
          {[0, 1, 2, 3, 4].map(l => (
            <div key={l} className="heatmap-cell" data-level={l} style={{ cursor: 'default' }} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
