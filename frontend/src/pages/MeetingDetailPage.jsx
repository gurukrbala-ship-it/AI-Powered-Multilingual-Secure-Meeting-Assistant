import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { meetingsAPI, participantsAPI, aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const LANG_NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', ml: 'Malayalam', te: 'Telugu', kn: 'Kannada' };

function StatusBadge({ status }) {
  const map = {
    active: 'badge-success', ended: 'badge-muted',
    scheduled: 'badge-info', cancelled: 'badge-danger',
  };
  return (
    <span className={`badge ${map[status] || 'badge-muted'}`}>
      {status === 'active' ? '● ' : ''}{status}
    </span>
  );
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      meetingsAPI.get(id),
      participantsAPI.list(id),
    ])
      .then(([mRes, pRes]) => {
        setMeeting(mRes.data);
        setParticipants(pRes.data);
      })
      .catch(() => toast.error('Failed to load meeting details'))
      .finally(() => setLoading(false));
  }, [id]);

  const isHost = meeting?.host_id === user?.id || user?.role === 'admin';

  const handleStart = async () => {
    setActionLoading('start');
    try {
      const res = await meetingsAPI.start(id);
      setMeeting(res.data);
      toast.success('Meeting started!');
      navigate(`/meetings/${id}/live`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to start meeting');
    } finally {
      setActionLoading('');
    }
  };

  const handleEnd = async () => {
    if (!confirm('End this meeting?')) return;
    setActionLoading('end');
    try {
      const res = await meetingsAPI.end(id);
      setMeeting(res.data);
      toast.success('Meeting ended');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to end meeting');
    } finally {
      setActionLoading('');
    }
  };

  const handleGenerateSummary = async () => {
    setActionLoading('summary');
    try {
      await aiAPI.generateSummary(id);
      toast.success('AI summary generated!');
      navigate(`/meetings/${id}/summary`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate summary');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 300, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontWeight: 600 }}>Meeting not found</div>
        <Link to="/meetings" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>← Back to Meetings</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        <Link to="/meetings" style={{ color: 'var(--text-muted)' }}>Meetings</Link>
        <span> / </span>
        <span>{meeting.title}</span>
      </div>

      {meeting.is_confidential && (
        <div className="confidential-banner">
          <span className="conf-icon">🔐</span>
          <div>
            <div className="conf-text">CONFIDENTIAL MEETING</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Restricted access · Audit logging enabled
            </div>
          </div>
        </div>
      )}

      {/* Meeting Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{meeting.title}</h1>
                <StatusBadge status={meeting.status} />
                {meeting.is_demo && <span className="badge badge-info" style={{ fontSize: 11 }}>Demo</span>}
              </div>
              {meeting.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{meeting.description}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>📅 {meeting.scheduled_time ? format(new Date(meeting.scheduled_time), 'MMM d, yyyy h:mm a') : 'Not scheduled'}</div>
                <div>⏱ {meeting.expected_duration_minutes} min expected</div>
                <div>👥 {meeting.participant_count} participants</div>
                <div>🌐 {LANG_NAMES[meeting.speech_language] || meeting.speech_language}</div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {meeting.status === 'scheduled' && isHost && (
                <button
                  className="btn btn-success"
                  onClick={handleStart}
                  disabled={actionLoading === 'start'}
                >
                  {actionLoading === 'start' ? '...' : '▶ Start Meeting'}
                </button>
              )}
              {meeting.status === 'active' && (
                <Link to={`/meetings/${id}/live`} className="btn btn-primary">
                  ▶ Join Live
                </Link>
              )}
              {meeting.status === 'active' && isHost && (
                <button
                  className="btn btn-danger"
                  onClick={handleEnd}
                  disabled={actionLoading === 'end'}
                >
                  {actionLoading === 'end' ? '...' : '■ End Meeting'}
                </button>
              )}
              {meeting.status === 'ended' && isHost && (
                <button
                  className="btn btn-outline"
                  onClick={handleGenerateSummary}
                  disabled={actionLoading === 'summary'}
                >
                  {actionLoading === 'summary' ? '...' : '✦ Generate AI Summary'}
                </button>
              )}
              {meeting.status === 'ended' && (
                <>
                  <Link to={`/meetings/${id}/summary`} className="btn btn-primary">
                    View Summary
                  </Link>
                  <Link to={`/meetings/${id}/qa`} className="btn btn-outline">
                    💬 Ask AI
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {['overview', 'participants', 'transcript', 'actions'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 13.5,
              cursor: 'pointer',
              marginBottom: -2,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><div className="card-title">Meeting Details</div></div>
            <div className="card-body">
              <table style={{ width: '100%', fontSize: 13.5 }}>
                <tbody>
                  {[
                    ['Type', meeting.meeting_type?.replace('_', ' ')],
                    ['Host', meeting.host?.name],
                    ['Created', meeting.created_at ? format(new Date(meeting.created_at), 'MMM d, yyyy h:mm a') : '—'],
                    ['Started', meeting.start_time ? format(new Date(meeting.start_time), 'MMM d, yyyy h:mm a') : '—'],
                    ['Ended', meeting.end_time ? format(new Date(meeting.end_time), 'MMM d, yyyy h:mm a') : '—'],
                    ['Duration', meeting.duration_minutes ? `${Math.round(meeting.duration_minutes)} min` : '—'],
                    ['Room Code', meeting.room_code],
                    ['Security', meeting.is_confidential ? '🔐 Confidential' : 'Standard'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '8px 0', color: 'var(--text-muted)', width: '40%', borderBottom: '1px solid var(--border-light)', fontSize: 12.5, fontWeight: 500 }}>{k}</td>
                      <td style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontWeight: 500 }}>{v || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Languages</div></div>
            <div className="card-body">
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Speech Language</div>
                <span className="badge badge-primary">{LANG_NAMES[meeting.speech_language] || meeting.speech_language}</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Participant Languages</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {meeting.participant_languages?.map((l) => (
                    <span key={l} className="badge badge-muted">{LANG_NAMES[l] || l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'participants' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Participants ({participants.length})</div>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Language</th>
                  <th>Joined</th>
                  <th>Left</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'var(--primary)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {p.user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.user?.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{p.role}</span></td>
                    <td>{LANG_NAMES[p.preferred_language] || p.preferred_language}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {p.joined_at ? format(new Date(p.joined_at), 'h:mm a') : '—'}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {p.left_at ? format(new Date(p.left_at), 'h:mm a') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'transcript' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Link to={`/meetings/${id}/transcript`} className="btn btn-primary">
            View Full Transcript →
          </Link>
        </div>
      )}

      {tab === 'actions' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Link to={`/meetings/${id}/summary`} className="btn btn-primary">
            View Summary & Actions →
          </Link>
        </div>
      )}
    </div>
  );
}
