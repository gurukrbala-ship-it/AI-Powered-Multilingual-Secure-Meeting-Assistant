import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  critical: { bg: '#fee2e2', color: '#991b1b' },
  high: { bg: '#fef3c7', color: '#92400e' },
  medium: { bg: '#dbeafe', color: '#1e40af' },
  low: { bg: '#d1fae5', color: '#065f46' },
};

const QA_SUGGESTIONS = [
  'What was the final decision?',
  'Who is responsible for testing?',
  'What deadlines were discussed?',
  'Summarize the meeting in three points.',
  'Show all action items.',
  'What did Rahul agree to do?',
];

export default function MeetingSummaryPage() {
  const { id } = useParams();
  const { isDemoMode } = useAuth();
  const [summary, setSummary] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');

  // Q&A state
  const [question, setQuestion] = useState('');
  const [qaMessages, setQaMessages] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      aiAPI.getSummary(id).catch(() => null),
      aiAPI.getDecisions(id).catch(() => ({ data: [] })),
      aiAPI.getActions(id).catch(() => ({ data: [] })),
    ]).then(([sRes, dRes, aRes]) => {
      setSummary(sRes?.data);
      setDecisions(dRes?.data || []);
      setActions(aRes?.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAsk = async (q) => {
    const questionText = q || question;
    if (!questionText.trim()) return;

    setQaMessages((prev) => [...prev, { role: 'user', text: questionText }]);
    setQuestion('');
    setQaLoading(true);

    try {
      const res = await aiAPI.ask(id, questionText);
      setQaMessages((prev) => [...prev, {
        role: 'assistant',
        text: res.data.answer,
        sources: res.data.sources,
        is_demo: res.data.is_demo,
      }]);
    } catch {
      setQaMessages((prev) => [...prev, {
        role: 'assistant',
        text: 'Unable to process your question. Please try again.',
        sources: [],
      }]);
    } finally {
      setQaLoading(false);
    }
  };

  const updateActionStatus = async (itemId, status) => {
    try {
      await aiAPI.updateAction(itemId, { status });
      setActions((prev) => prev.map((a) => a.id === itemId ? { ...a, status } : a));
      toast.success('Action item updated');
    } catch {
      toast.error('Failed to update action item');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: 300, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (!summary && !loading) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Summary not generated yet</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20 }}>
          The meeting host needs to generate the AI summary after the meeting ends.
        </div>
        <Link to={`/meetings/${id}`} className="btn btn-outline">← Back to Meeting</Link>
      </div>
    );
  }

  const tabs = ['summary', 'decisions', 'actions', 'ask_ai'];

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        <Link to={`/meetings/${id}`} style={{ color: 'var(--text-muted)' }}>← Meeting</Link>
        <span> / Summary</span>
      </div>

      {isDemoMode && (
        <div className="demo-banner" style={{ marginBottom: 16, borderRadius: 8 }}>
          <div className="demo-dot" />
          <strong>DEMO MODE</strong> — AI summary generated from simulated meeting data
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {tabs.map((t) => {
          const labels = { summary: '📋 Summary', decisions: '⚖️ Decisions', actions: '✓ Action Items', ask_ai: '💬 Ask AI' };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: tab === t ? 600 : 400, fontSize: 13.5, cursor: 'pointer', marginBottom: -2,
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Summary Tab */}
      {tab === 'summary' && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">Executive Summary</div>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                  {summary.executive_summary}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Key Discussion Points</div>
              </div>
              <div className="card-body" style={{ paddingTop: 12 }}>
                {summary.key_points?.map((point, i) => (
                  <div key={i} className="key-point-item">{point}</div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {/* Sentiment */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><div className="card-title">Meeting Tone</div></div>
              <div className="card-body">
                <div style={{ marginBottom: 12 }}>
                  <span className={`sentiment-pill sentiment-${summary.sentiment}`}>
                    {summary.sentiment === 'positive' ? '😊' : summary.sentiment === 'concerned' ? '😟' : '😐'} {summary.sentiment}
                  </span>
                </div>
                {Object.entries(summary.tone_breakdown || {}).map(([tone, pct]) => (
                  <div key={tone} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12.5 }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{tone}</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div className="topic-bar-track">
                      <div className="topic-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="card">
              <div className="card-header"><div className="card-title">Topics</div></div>
              <div className="card-body">
                {summary.topics_discussed?.map((t, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span>{t.topic}</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.percentage}%</span>
                    </div>
                    <div className="topic-bar-track">
                      <div className="topic-bar-fill" style={{ width: `${t.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decisions Tab */}
      {tab === 'decisions' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Decisions Made ({decisions.length})</div>
          </div>
          {decisions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No decisions recorded in this meeting.
            </div>
          ) : (
            <div className="card-body">
              {decisions.map((d, i) => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 0', borderBottom: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>⚖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{d.decision}</div>
                    {d.decided_by && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        — {d.decided_by}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions Tab */}
      {tab === 'actions' && (
        <div>
          {['pending', 'in_progress', 'completed'].map((status) => {
            const statusActions = actions.filter((a) => a.status === status);
            const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
            return (
              <div key={status} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {labels[status]} ({statusActions.length})
                </div>
                {statusActions.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '10px 0' }}>None</div>
                ) : (
                  statusActions.map((a) => {
                    const pri = PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.medium;
                    return (
                      <div key={a.id} className="action-item-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{a.task}</div>
                          <span style={{ padding: '2px 8px', borderRadius: 20, background: pri.bg, color: pri.color, fontSize: 11, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                            {a.priority}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                          {a.assigned_to_name && <div>👤 {a.assigned_to_name}</div>}
                          <div>📅 {a.deadline || 'Not specified'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['pending', 'in_progress', 'completed'].map((s) => (
                            <button
                              key={s}
                              className={`btn btn-sm ${a.status === s ? 'btn-primary' : 'btn-outline'}`}
                              style={{ fontSize: 11, padding: '3px 8px' }}
                              onClick={() => updateActionStatus(a.id, s)}
                            >
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ask AI Tab */}
      {tab === 'ask_ai' && (
        <div className="card" style={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">💬 Ask AI About This Meeting</div>
            {isDemoMode && <span className="badge badge-info" style={{ fontSize: 11 }}>Demo Mode</span>}
          </div>

          {/* Suggestion chips */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Suggested questions:</div>
            <div className="qa-suggestions">
              {QA_SUGGESTIONS.map((q) => (
                <button key={q} className="qa-suggestion-chip" onClick={() => handleAsk(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="qa-messages">
            {qaMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Ask anything about this meeting</div>
                <div style={{ fontSize: 12.5 }}>Answers are grounded in the meeting transcript and summary</div>
              </div>
            ) : (
              qaMessages.map((msg, i) => (
                <div key={i} className={`qa-message ${msg.role}`}>
                  <div className="qa-avatar">
                    {msg.role === 'user' ? '👤' : '✦'}
                  </div>
                  <div>
                    <div className="qa-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </div>
                    {msg.sources?.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        Sources: {msg.sources.map(s => s.speaker || s.type).filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {qaLoading && (
              <div className="qa-message assistant">
                <div className="qa-avatar">✦</div>
                <div className="qa-bubble">
                  <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="qa-input-area">
            <div className="qa-input-row">
              <input
                type="text"
                className="form-control"
                placeholder="Ask a question about this meeting..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                disabled={qaLoading}
                aria-label="Ask AI a question"
              />
              <button
                className="btn btn-primary"
                onClick={() => handleAsk()}
                disabled={!question.trim() || qaLoading}
              >
                Ask →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
