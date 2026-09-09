import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { insightsAPI } from '../api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_ICONS = { transcript: '📝', decision: '⚖️', action_item: '✓', meeting: '📅', summary: '📋' };

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, []);

  const performSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await insightsAPI.search(q.trim());
      setResults(res.data || []);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    performSearch(query);
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.meeting_id]) acc[r.meeting_id] = { title: r.meeting_title, items: [] };
    acc[r.meeting_id].items.push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Search across meetings, transcripts, decisions, and action items</p>
      </div>

      <form onSubmit={handleSearch} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 600 }}>
          <div className="search-input" style={{ flex: 1 }}>
            <span style={{ color: 'var(--text-muted)' }}>⊙</span>
            <input
              type="text"
              placeholder="Search for topics, decisions, speakers, action items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%' }}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Quick searches */}
      {!searched && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Try searching for:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['backend', 'testing', 'deadline', 'budget', 'deployment', 'Friday'].map((q) => (
              <button
                key={q}
                className="qa-suggestion-chip"
                onClick={() => { setQuery(q); setSearchParams({ q }); performSearch(q); }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No results found</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try different keywords or check spelling</div>
        </div>
      ) : searched && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{searchParams.get('q')}"
          </div>

          {Object.entries(grouped).map(([meetingId, group]) => (
            <div key={meetingId} style={{ marginBottom: 24 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                fontSize: 14, fontWeight: 700,
              }}>
                <span>📅</span>
                <Link to={`/meetings/${meetingId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                  {group.title}
                </Link>
                <span className="badge badge-muted" style={{ fontSize: 11, fontWeight: 400 }}>
                  {group.items.length} match{group.items.length !== 1 ? 'es' : ''}
                </span>
              </div>

              {group.items.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: 'white', borderRadius: 8, border: '1px solid var(--border)',
                  marginBottom: 8,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    {TYPE_ICONS[r.result_type] || '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {r.result_type.replace('_', ' ')}
                      {r.speaker && ` · ${r.speaker}`}
                      {r.offset_seconds !== null && r.offset_seconds !== undefined && ` · ${Math.floor(r.offset_seconds / 60)}:${Math.floor(r.offset_seconds % 60).toString().padStart(2, '0')}`}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{r.content}</div>
                    {r.timestamp && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                        {format(new Date(r.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                  </div>
                  <Link to={`/meetings/${meetingId}/transcript`} className="btn btn-sm btn-outline" style={{ alignSelf: 'center', flexShrink: 0 }}>
                    View
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
