import { useEffect, useState } from 'react';
import { insightsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LANG_NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', ml: 'Malayalam', te: 'Telugu', kn: 'Kannada' };

export default function InsightsPage() {
  const { isDemoMode } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insightsAPI.dashboard()
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load insights'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 20 }} />
        <div className="grid grid-2">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      </div>
    );
  }

  const meetings = data?.recent_meetings || [];
  const typeBreakdown = meetings.reduce((acc, m) => {
    const t = m.meeting_type?.replace('_', ' ') || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const totalMeetings = data?.total_meetings || 0;

  const effectiveness = {
    'Total Meetings': totalMeetings,
    'Hours Transcribed': `${data?.hours_transcribed || 0}h`,
    'Languages Used': data?.languages_used?.length || 0,
    'Pending Actions': data?.pending_action_items || 0,
    'Confidential Meetings': data?.confidential_meetings || 0,
    'Meetings This Week': data?.meetings_this_week || 0,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Insights</h1>
        <p className="page-subtitle">Meeting analytics and intelligence overview</p>
      </div>

      {isDemoMode && (
        <div className="demo-banner" style={{ marginBottom: 20, borderRadius: 8 }}>
          <div className="demo-dot" />
          <strong>DEMO MODE</strong> — Analytics computed from demo meeting data
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Meeting Effectiveness */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Meeting Effectiveness</div>
          </div>
          <div className="card-body">
            {Object.entries(effectiveness).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border-light)',
                fontSize: 13.5,
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Languages Used</div>
          </div>
          <div className="card-body">
            {data?.languages_used?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No language data yet.</div>
            ) : (
              data?.languages_used?.map((l) => (
                <div key={l} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                    }}>
                      {l.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{LANG_NAMES[l] || l}</div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>Active</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Meeting Types */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Meeting Types</div>
          </div>
          <div className="card-body">
            {Object.keys(typeBreakdown).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No meeting type data yet.</div>
            ) : (
              Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const pct = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0;
                return (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ textTransform: 'capitalize' }}>{type}</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="topic-bar-track">
                      <div className="topic-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* IBM Technology Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">IBM Technology Status</div>
          </div>
          <div className="card-body">
            {[
              { name: 'IBM watsonx.ai', desc: 'AI summarization & Q&A', icon: '✦' },
              { name: 'IBM Watson STT', desc: 'Speech-to-text processing', icon: '🎙️' },
              { name: 'IBM Watson Language Translator', desc: 'Multilingual translation', icon: '🌐' },
              { name: 'IBM Cloud', desc: 'Secure cloud deployment', icon: '☁️' },
            ].map((s) => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border-light)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: isDemoMode ? '#f1f5f9' : '#d1fae5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
                <span className={`badge ${isDemoMode ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10.5 }}>
                  {isDemoMode ? 'Demo' : 'Live'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
