import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { insightsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const LANG_NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', ml: 'Malayalam', te: 'Telugu', kn: 'Kannada' };

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-change neutral">{sub}</div>}
    </div>
  );
}

function MeetingStatusBadge({ status }) {
  const map = {
    active: { cls: 'badge-success', label: '● Active' },
    ended: { cls: 'badge-muted', label: 'Ended' },
    scheduled: { cls: 'badge-info', label: 'Scheduled' },
    cancelled: { cls: 'badge-danger', label: 'Cancelled' },
  };
  const s = map[status] || map.scheduled;
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export default function DashboardPage() {
  const { user, isDemoMode } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsAPI.dashboard()
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 300, height: 18 }} />
        </div>
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110 }} />
          ))}
        </div>
      </div>
    );
  }

  const stats = data ? [
    { icon: '📅', label: 'Total Meetings', value: data.total_meetings, color: '#1a56db' },
    { icon: '📆', label: 'Meetings This Week', value: data.meetings_this_week, color: '#6366f1' },
    { icon: '⏱', label: 'Hours Transcribed', value: `${data.hours_transcribed}h`, color: '#06b6d4' },
    { icon: '🌐', label: 'Languages Used', value: data.languages_used.length, color: '#10b981' },
    { icon: '✓', label: 'Pending Action Items', value: data.pending_action_items, color: '#f59e0b' },
    { icon: '🔐', label: 'Confidential Meetings', value: data.confidential_meetings, color: '#8b5cf6' },
  ] : [];

  return (
    <div>
      {isDemoMode && (
        <div className="demo-banner" style={{ marginBottom: 20, borderRadius: 8 }}>
          <div className="demo-dot" />
          <strong>DEMO MODE</strong> — Using simulated data. Configure IBM credentials to enable live AI processing.
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.name}. Here's your meeting intelligence overview.
          </p>
        </div>
        <Link to="/meetings/new" className="btn btn-primary">
          + New Meeting
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Recent Meetings */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Meetings</div>
          <Link to="/meetings" className="btn btn-sm btn-outline">View all</Link>
        </div>
        {data?.recent_meetings?.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No meetings yet</div>
            <div style={{ fontSize: 13 }}>Create your first meeting to get started.</div>
            <Link to="/meetings/new" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
              Create Meeting
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Meeting</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Participants</th>
                  <th>Languages</th>
                  <th>Security</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_meetings?.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</div>
                      {m.is_demo && (
                        <span className="badge badge-info" style={{ marginTop: 3, fontSize: 10 }}>Demo</span>
                      )}
                    </td>
                    <td><MeetingStatusBadge status={m.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {m.scheduled_time
                        ? format(new Date(m.scheduled_time), 'MMM d, yyyy')
                        : m.created_at
                          ? formatDistanceToNow(new Date(m.created_at), { addSuffix: true })
                          : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.participant_count}</td>
                    <td>
                      {m.participant_languages?.map((l) => (
                        <span key={l} className="badge badge-muted" style={{ marginRight: 4, fontSize: 11 }}>
                          {LANG_NAMES[l] || l}
                        </span>
                      ))}
                    </td>
                    <td>
                      {m.is_confidential
                        ? <span className="badge badge-confidential">🔐 Confidential</span>
                        : <span className="badge badge-muted">Standard</span>}
                    </td>
                    <td>
                      <Link to={`/meetings/${m.id}`} className="btn btn-sm btn-outline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-3" style={{ marginTop: 24 }}>
        <Link to="/meetings/new" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>+</div>
            <div>
              <div style={{ fontWeight: 600 }}>Create Meeting</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Start a new meeting</div>
            </div>
          </div>
        </Link>
        <Link to="/actions" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✓</div>
            <div>
              <div style={{ fontWeight: 600 }}>Action Items</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>View your tasks</div>
            </div>
          </div>
        </Link>
        <Link to="/insights" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✦</div>
            <div>
              <div style={{ fontWeight: 600 }}>AI Insights</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Meeting analytics</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
