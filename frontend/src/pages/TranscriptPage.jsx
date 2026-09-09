import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { transcriptAPI, meetingsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const SPEAKER_COLORS = ['#1a56db', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
const LANG_NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', ml: 'Malayalam', te: 'Telugu', kn: 'Kannada' };

export default function TranscriptPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState('en');
  const [search, setSearch] = useState('');
  const [showTranslation, setShowTranslation] = useState(true);
  const speakerColorMap = useRef({});
  const speakerCount = useRef(0);

  useEffect(() => {
    Promise.all([
      meetingsAPI.get(id),
      transcriptAPI.get(id),
    ]).then(([mRes, tRes]) => {
      setMeeting(mRes.data);
      setSegments(tRes.data || []);
      if (mRes.data?.participant_languages?.[0]) {
        setSelectedLang(mRes.data.participant_languages[0]);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const getSpeakerColor = (speakerId) => {
    if (!speakerColorMap.current[speakerId]) {
      speakerCount.current += 1;
      speakerColorMap.current[speakerId] = SPEAKER_COLORS[(speakerCount.current - 1) % SPEAKER_COLORS.length];
    }
    return speakerColorMap.current[speakerId];
  };

  const filtered = segments.filter((s) =>
    !search || s.original_text.toLowerCase().includes(search.toLowerCase()) ||
    s.speaker_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatOffset = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return <div style={{ padding: 40 }}><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        <Link to={`/meetings/${id}`} style={{ color: 'var(--text-muted)' }}>← Meeting</Link>
        <span> / Transcript</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Transcript</h1>
          <p className="page-subtitle">{meeting?.title} · {segments.length} segments</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-input">
            <span style={{ color: 'var(--text-muted)' }}>⊙</span>
            <input
              type="text"
              placeholder="Search transcript..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {meeting?.participant_languages?.map((l) => (
              <option key={l} value={l}>{LANG_NAMES[l] || l}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showTranslation}
              onChange={(e) => setShowTranslation(e.target.checked)}
            />
            Show translation
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
          <div style={{ fontWeight: 600 }}>No transcript found</div>
          {search && <div style={{ fontSize: 13, marginTop: 6 }}>No results for "{search}"</div>}
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: '8px 0' }}>
            {filtered.map((seg, i) => {
              const color = getSpeakerColor(seg.speaker_id || 'default');
              const translation = seg.translations?.[selectedLang];
              return (
                <div
                  key={seg.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border-light)',
                    transition: 'background 200ms',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  {/* Timestamp + Speaker */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 12.5, fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {formatOffset(seg.offset_seconds)}
                    </div>
                    <div style={{
                      fontSize: 11.5, fontWeight: 700,
                      color: color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                    }}>
                      {seg.speaker_name || seg.speaker_id || `Speaker`}
                    </div>
                  </div>

                  {/* Text */}
                  <div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: showTranslation && translation ? 8 : 0 }}>
                      {seg.original_text}
                    </div>
                    {showTranslation && translation && selectedLang !== seg.source_language && (
                      <div style={{
                        fontSize: 13.5, lineHeight: 1.6,
                        color: 'var(--text-secondary)',
                        padding: '6px 10px',
                        background: 'var(--bg)',
                        borderRadius: 6,
                        borderLeft: `3px solid ${color}`,
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 6 }}>
                          {LANG_NAMES[selectedLang]}:
                        </span>
                        {translation}
                      </div>
                    )}
                    {seg.confidence < 0.8 && (
                      <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                        ⚠ Low confidence: {Math.round(seg.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
