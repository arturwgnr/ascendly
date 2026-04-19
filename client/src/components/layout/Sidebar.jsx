import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/layout.css';

const NAV = [
  { to: '/',         icon: '⊞',  label: 'Dashboard' },
  { to: '/study',    icon: '◉',  label: 'Study'     },
  { to: '/growth',   icon: '◈',  label: 'Growth'    },
  { to: '/tasks',    icon: '▦',  label: 'Tasks'     },
  { to: '/journal',  icon: '◳',  label: 'Journal', soon: true },
];

const BOTTOM = [
  { to: '/settings', icon: '⊙', label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const initials = user?.email
    ? user.email[0].toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">ᨒ</span>
        <span className="sidebar-brand-name">Ascendly</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigate</span>
        {NAV.map(({ to, icon, label, soon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' active' : '') + (soon ? ' muted' : '')
            }
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span>{label}</span>
            {soon && (
              <span className="tag tag-muted" style={{ marginLeft: 'auto', fontSize: '0.62rem' }}>
                soon
              </span>
            )}
          </NavLink>
        ))}

        <span className="sidebar-section-label" style={{ marginTop: 8 }}>Account</span>
        {BOTTOM.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Sign out">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
