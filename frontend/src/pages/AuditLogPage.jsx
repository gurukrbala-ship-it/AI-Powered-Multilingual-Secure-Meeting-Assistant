import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AuditLogPage() {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiAPI.getAuditLogs(id)
      .then((r) => setLogs(r.data || []))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [id]);

  const ACTION_LABELS = {
    user_registered: 'User Registered',
    user_login: 'User Login',
    user_logout: 'User Logout',
    meeting_created: 'Meeting Created',
    meeting_started: 'Meeting Started',
    meeting_ended: 'Meeting Ended',
    meeting_updated: 'Meeting Updated',
    meeting_deleted: 'Meeting Deleted',
    summary_generated: 'Summary Generated',
    ai_question_asked: 'AI Question Asked',
    transcript_viewed: 'Transcript Viewed',
  };

  const ACTION_ICONS = {
    user_registered: '👤',
    user_login: '🔓',
    user_logout: '🔒',
    meeting_created: '📅',
    meeting_started: '▶',
    meeting_ended: '■',
    summary_generated: '✦',
    ai_question_asked: '💬',
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        <Link to={`/meetings/${id}`} style={{ color: 'var(--text-muted)' }}>← Meeting</Link>
        <span> / Audit Log</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">Complete security event trail for this meeting</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">🔐 Security Events ({logs.length})</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 50 }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 600 }}>No audit events recorded</div>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{ACTION_ICONS[log.action] || '📋'}</span>
                        <span style={{ fontWeight: 500 }}>
                          {ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.user || 'System'}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 200 }}>
                      {log.details && Object.keys(log.details).length > 0
                        ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : '—'
                      }
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {format(new Date(log.timestamp), 'MMM d, h:mm:ss a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
