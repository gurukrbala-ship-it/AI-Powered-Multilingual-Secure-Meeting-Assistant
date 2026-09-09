import { useAuth } from '../context/AuthContext';

const NOTIFICATIONS = [
  { icon: '📅', title: 'Meeting invitation', desc: 'You were invited to Project Phoenix Development Review', time: '2 hours ago', unread: true },
  { icon: '✓', title: 'Action item assigned', desc: 'Complete backend development — assigned to you', time: '3 hours ago', unread: true },
  { icon: '✦', title: 'Summary generated', desc: 'AI summary is ready for Project Phoenix Development Review', time: '4 hours ago', unread: false },
  { icon: '🔐', title: 'Confidential meeting access', desc: 'You have been granted access to Q4 Strategy Review', time: '1 day ago', unread: false },
  { icon: '📅', title: 'Meeting starting soon', desc: 'Team Standup starts in 15 minutes', time: '2 days ago', unread: false },
];

export default function NotificationsPage() {
  const { isDemoMode } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">Stay updated on meetings and action items</p>
      </div>

      {isDemoMode && (
        <div className="demo-banner" style={{ marginBottom: 16, borderRadius: 8 }}>
          <div className="demo-dot" />
          <strong>DEMO MODE</strong> — Showing sample notifications
        </div>
      )}

      <div>
        {NOTIFICATIONS.map((n, i) => (
          <div key={i} className={`notification-item ${n.unread ? 'unread' : ''}`}>
            <div className="notification-icon">{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.unread ? 600 : 400, fontSize: 14 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{n.desc}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{n.time}</div>
            {n.unread && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
