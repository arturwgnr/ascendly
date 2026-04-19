import '../../styles/layout.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TopBar({ title }) {
  const now = new Date();
  const dateStr = `${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-right">
        <span className="topbar-date">{dateStr}</span>
      </div>
    </header>
  );
}
