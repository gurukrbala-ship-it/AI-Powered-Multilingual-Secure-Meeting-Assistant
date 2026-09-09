import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: '⊞', to: '/dashboard' },
  { label: 'My Meetings', icon: '📅', to: '/meetings' },
  { label: 'Create Meeting', icon: '+', to: '/meetings/new', highlight: true },
  { label: 'Action Items', icon: '✓', to: '/actions' },
  { label: 'AI Insights', icon: '✦', to: '/insights' },
  { label: 'Search', icon: '⊙', to: '/search' },
];

const adminItems = [
  { label: 'Security', icon: '🔐', to: '/security' },
  { label: 'Notifications', icon: '🔔', to: '/notifications' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={onClose}
        />
      )}

      <aside className={`app-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          <div className="logo-text">LinguaMeet AI</div>
          <div className="logo-sub">Meeting Intelligence Platform</div>
        </div>

        {isDemoMode && (
          <div style={{
            margin: '8px 12px',
            padding: '6px 10px',
            background: 'rgba(167,139,250,0.12)',
            borderRadius: '6px',
            border: '1px solid rgba(167,139,250,0.2)',
          }}>
            <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>
              ⬡ DEMO MODE
            </span>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="sidebar-section-label">Account</div>
          {adminItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <span className="icon">⚙</span>
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13,
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user?.role}</div>
            </div>
          </div>
          <button className="sidebar-item" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="icon">↩</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
