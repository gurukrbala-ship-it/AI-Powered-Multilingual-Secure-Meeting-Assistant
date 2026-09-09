import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meetingsAPI } from '../api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: { bg: '#d1fae5', color: '#065f46', label: '● Active' },
  ended: { bg: '#f1f5f9', color: '#475569', label: 'Ended' },
  scheduled: { bg: '#dbeafe', color: '#1e40af', label: 'Scheduled' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const LANG_NAMES = { en: 'EN', ta: 'TA', hi: 'HI', ml: 'ML', te: 'TE', kn: 'KN' };

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    meetingsAPI.list()
      .then((r) => setMeetings(r.data))
      .catch(() => toast.error('Failed to load meetings'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = meetings.filter((m) => {
    const matchStatus = filter === 'all' || m.status === filter;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Meetings</h1>
          <p className="page-subtitle">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/meetings/new" className="btn btn-primary">+ Create Meeting</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input" style={{ flex: '1', minWidth: 200, maxWidth: 360 }}>
          <span style={{ color: 'var(--text-muted)' }}>⊙</span>
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        {['all', 'scheduled', 'active', 'ended'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No meetings found</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {search ? 'Try a different search term.' : 'Create your first meeting to get started.'}
          </div>
          <Link to="/meetings/new" className="btn btn-primary btn-sm">Create Meeting</Link>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map((m) => {
            const statusStyle = STATUS_COLORS[m.status] || STATUS_COLORS.scheduled;
            return (
              <Link key={m.id} to={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                <div className="meeting-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div className="meeting-title" style={{ flex: 1, marginRight: 8 }}>{m.title}</div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 20,
                        background: statusStyle.bg, color: statusStyle.color,
                        fontSize: 11.5, fontWeight: 500,
                      }}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {m.description && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {m.description}
                    </div>
                  )}

                  <div className="meeting-meta">
                    <div className="meta-item">
                      <span>📅</span>
                      {m.scheduled_time
                        ? format(new Date(m.scheduled_time), 'MMM d, yyyy')
                        : formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </div>
                    <div className="meta-item">
                      <span>👥</span>
                      {m.participant_count} participant{m.participant_count !== 1 ? 's' : ''}
                    </div>
                    {m.duration_minutes && (
                      <div className="meta-item">
                        <span>⏱</span>
                        {Math.round(m.duration_minutes)}m
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {m.participant_languages?.slice(0, 4).map((l) => (
                        <span key={l} className="badge badge-muted" style={{ fontSize: 10 }}>{LANG_NAMES[l] || l}</span>
                      ))}
                    </div>
                    {m.is_confidential && (
                      <span className="badge badge-confidential" style={{ fontSize: 10 }}>🔐 Confidential</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
