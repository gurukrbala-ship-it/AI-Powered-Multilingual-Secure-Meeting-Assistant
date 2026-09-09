import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsAPI, transcriptAPI, aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LANG_NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', ml: 'Malayalam', te: 'Telugu', kn: 'Kannada' };
const SPEAKER_COLORS = ['#1a56db', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export default function LiveMeetingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [segments, setSegments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState(user?.preferred_language || 'en');
  const [participantCount, setParticipantCount] = useState(1);
  const [duration, setDuration] = useState(0);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [isDemoStreaming, setIsDemoStreaming] = useState(false);

  const wsRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const translationEndRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakerMapRef = useRef({});
  const speakerCountRef = useRef(0);

  useEffect(() => {
    meetingsAPI.get(id).then((r) => {
      setMeeting(r.data);
      setSelectedLang(r.data.participant_languages?.[0] || 'en');
    }).catch(() => toast.error('Failed to load meeting'));

    // Load existing transcript
    transcriptAPI.get(id).then((r) => {
      setSegments(r.data || []);
    }).catch(() => {});

    connectWebSocket();

    return () => {
      wsRef.current?.close();
      clearInterval(timerRef.current);
      stopRecording();
    };
  }, [id]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    translationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_URL}/ws/meeting/${id}/${user.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      ws.send(JSON.stringify({ event: 'meeting:join', data: { name: user.name } }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      handleWSMessage(msg);
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => setWsStatus('error');
  };

  const handleWSMessage = (msg) => {
    if (msg.event === 'transcript:update') {
      const d = msg.data;
      const speakerId = d.speaker_id || 'speaker_1';

      // Assign speaker number consistently
      if (!speakerMapRef.current[speakerId]) {
        speakerCountRef.current += 1;
        speakerMapRef.current[speakerId] = speakerCountRef.current;
      }

      const segment = {
        id: `ws_${Date.now()}_${Math.random()}`,
        speaker_id: speakerId,
        speaker_name: d.speaker_name,
        speaker_num: speakerMapRef.current[speakerId],
        original_text: d.text,
        translations: d.translations || {},
        timestamp: d.timestamp,
        offset_seconds: d.offset || 0,
        confidence: d.confidence || 1.0,
        is_demo: d.is_demo,
      };
      setSegments((prev) => [...prev, segment]);
    } else if (msg.event === 'participant:joined' || msg.event === 'participant:left') {
      setParticipantCount(msg.data.count || 1);
    } else if (msg.event === 'notification:update') {
      toast(msg.data.message, { duration: 3000 });
    }
  };

  const startDemoStream = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'demo:start_stream', data: {} }));
      setIsDemoStreaming(true);
      toast.success('Demo stream started — simulated transcript will appear');
    }
  };

  const startRecording = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser. Use demo mode.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = meeting?.speech_language || 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          // Send via WebSocket
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              event: 'transcript:update',
              data: {
                speaker_id: user.id,
                speaker_name: user.name,
                text,
                confidence,
                translations: {},
                offset: duration,
              },
            }));
          }

          // Also save to API
          transcriptAPI.add(id, {
            speaker_id: user.id,
            speaker_name: user.name,
            original_text: text,
            source_language: meeting?.speech_language || 'en',
            confidence,
            offset_seconds: duration,
          }).catch(() => {});
        }
      }
    };

    recognition.onerror = () => {
      toast.error('Speech recognition error. Please try again.');
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);

    // Start timer
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

    toast.success('Recording started');
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const handleEndMeeting = async () => {
    if (!confirm('End this meeting? All participants will be disconnected.')) return;
    stopRecording();
    try {
      await meetingsAPI.end(id);
      toast.success('Meeting ended');
      navigate(`/meetings/${id}`);
    } catch {
      toast.error('Failed to end meeting');
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTranslation = (segment) => {
    if (segment.translations && segment.translations[selectedLang]) {
      return segment.translations[selectedLang];
    }
    if (selectedLang === segment.source_language || selectedLang === 'en') {
      return segment.original_text;
    }
    return null;
  };

  const getSpeakerColor = (num) => SPEAKER_COLORS[(num - 1) % SPEAKER_COLORS.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))' }}>
      {/* Meeting Top Bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{meeting?.title || 'Loading...'}</div>

        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 13, fontWeight: 500 }}>
            <div className="recording-dot" />
            REC {formatDuration(duration)}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>👥</span> {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>

        {meeting?.is_confidential && (
          <span className="badge badge-confidential">🔐 Confidential</span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: wsStatus === 'connected' ? 'var(--success)' : 'var(--danger)' }}>
            ● {wsStatus}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, overflow: 'hidden' }}>
        {/* Live Transcript */}
        <div className="transcript-panel" style={{ borderRadius: 0, borderRight: '1px solid var(--border)' }}>
          <div className="panel-header">
            <div className="panel-title">🎙️ Live Transcript</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {meeting?.is_demo !== false && !isRecording && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={startDemoStream}
                  disabled={isDemoStreaming}
                >
                  {isDemoStreaming ? '⬡ Streaming...' : '⬡ Demo Stream'}
                </button>
              )}
            </div>
          </div>
          <div className="panel-body" id="transcript-body">
            {segments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🎙️</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Waiting for speech...</div>
                <div style={{ fontSize: 12.5 }}>Click "Start Recording" or "Demo Stream" to begin</div>
              </div>
            ) : (
              segments.map((seg, idx) => {
                const speakerNum = seg.speaker_num || 1;
                const color = getSpeakerColor(speakerNum);
                return (
                  <div key={seg.id || idx} className={`transcript-segment speaker-${speakerNum}`} style={{ borderLeftColor: color }}>
                    <div className="segment-speaker" style={{ color }}>
                      {seg.speaker_name || `Speaker ${speakerNum}`}
                      {seg.is_demo && <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>(demo)</span>}
                    </div>
                    <div className="segment-text">{seg.original_text}</div>
                    <div className="segment-timestamp">
                      {seg.timestamp ? format(new Date(seg.timestamp), 'h:mm:ss a') : ''}
                      {seg.confidence < 1 && (
                        <span style={{ marginLeft: 8 }}>
                          {Math.round(seg.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Live Translation */}
        <div className="translation-panel" style={{ borderRadius: 0 }}>
          <div className="panel-header">
            <div className="panel-title">🌐 Translation</div>
            <select
              className="form-control"
              style={{ width: 'auto', fontSize: 12.5, padding: '4px 8px' }}
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              aria-label="Select translation language"
            >
              {meeting?.participant_languages?.map((l) => (
                <option key={l} value={l}>{LANG_NAMES[l] || l}</option>
              ))}
            </select>
          </div>
          <div className="panel-body">
            {segments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🌐</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Waiting for translation...</div>
                <div style={{ fontSize: 12.5 }}>Translations appear here in real time</div>
              </div>
            ) : (
              segments.map((seg, idx) => {
                const translation = getTranslation(seg);
                const speakerNum = seg.speaker_num || 1;
                const color = getSpeakerColor(speakerNum);
                return (
                  <div key={`tr_${seg.id || idx}`} className={`transcript-segment speaker-${speakerNum}`} style={{ borderLeftColor: color }}>
                    <div className="segment-speaker" style={{ color }}>
                      {seg.speaker_name || `Speaker ${speakerNum}`} → {LANG_NAMES[selectedLang] || selectedLang}
                    </div>
                    {translation ? (
                      <div className="segment-text">{translation}</div>
                    ) : (
                      <div className="segment-text" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Translation not available
                        {selectedLang !== 'en' && ' — configure IBM Translator for live translation'}
                      </div>
                    )}
                    <div className="segment-timestamp" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11 }}>{seg.original_text.substring(0, 50)}{seg.original_text.length > 50 ? '...' : ''}</span>
                      <span>{seg.timestamp ? format(new Date(seg.timestamp), 'h:mm:ss a') : ''}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={translationEndRef} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="meeting-controls">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            className={`control-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? '⏹' : '🎙'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isRecording ? 'Recording' : 'Record'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            className={`control-btn ${isMuted ? 'active' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isMuted ? 'Unmute' : 'Mute'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            className="control-btn"
            onClick={() => {}}
            title="Language"
            aria-label="Select language"
          >
            🌐
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Language</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            className="control-btn"
            onClick={() => {}}
            title="Participants"
            aria-label="Show participants"
          >
            👥
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>People</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            className="control-btn danger"
            onClick={handleEndMeeting}
            title="End Meeting"
            aria-label="End meeting"
          >
            ✕
          </button>
          <span style={{ fontSize: 10, color: 'var(--danger)' }}>End</span>
        </div>
      </div>

      {/* Recording Consent Notice */}
      {!isRecording && segments.length === 0 && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '14px 20px', boxShadow: 'var(--shadow-lg)',
          maxWidth: 480, width: '90%', zIndex: 100, textAlign: 'center',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Recording Consent</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Recording this meeting will capture audio and transcript data for participants in this session.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/meetings/${id}`)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={startRecording}>Start Recording</button>
          </div>
        </div>
      )}
    </div>
  );
}
