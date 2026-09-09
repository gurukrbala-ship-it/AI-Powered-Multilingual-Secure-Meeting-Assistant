import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

const MEETING_TYPES = [
  { value: 'business', label: 'Business Meeting' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'government', label: 'Government' },
  { value: 'conference', label: 'Conference' },
  { value: 'team_meeting', label: 'Team Meeting' },
  { value: 'other', label: 'Other' },
];

export default function CreateMeetingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    meeting_type: 'business',
    scheduled_time: '',
    expected_duration_minutes: 60,
    speech_language: 'en',
    participant_languages: ['en'],
    is_confidential: false,
    meeting_pin: '',
    require_approval: false,
    encrypted_storage: false,
    session_timeout_minutes: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const toggleLanguage = (code) => {
    const langs = form.participant_languages.includes(code)
      ? form.participant_languages.filter((l) => l !== code)
      : [...form.participant_languages, code];
    setForm({ ...form, participant_languages: langs });
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Meeting title is required';
    if (form.participant_languages.length === 0) errs.languages = 'Select at least one participant language';
    if (form.is_confidential && !form.meeting_pin) errs.meeting_pin = 'PIN is required for confidential meetings';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        expected_duration_minutes: parseInt(form.expected_duration_minutes),
        session_timeout_minutes: form.session_timeout_minutes ? parseInt(form.session_timeout_minutes) : null,
        scheduled_time: form.scheduled_time || null,
      };
      const res = await meetingsAPI.create(payload);
      toast.success('Meeting created successfully!');
      navigate(`/meetings/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Meeting Info', 'Languages', 'Security'];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Create Meeting</h1>
        <p className="page-subtitle">Configure your AI-powered multilingual meeting</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'white', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {steps.map((s, i) => (
          <div
            key={i}
            onClick={() => i + 1 < step && setStep(i + 1)}
            style={{
              flex: 1,
              padding: '14px 20px',
              background: step === i + 1 ? 'var(--primary)' : step > i + 1 ? '#e8f0fe' : 'white',
              color: step === i + 1 ? 'white' : step > i + 1 ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: step === i + 1 ? 600 : 400,
              fontSize: 13.5,
              cursor: i + 1 < step ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: step === i + 1 ? 'rgba(255,255,255,0.25)' : step > i + 1 ? 'var(--primary)' : 'var(--bg)',
              color: step === i + 1 ? 'white' : step > i + 1 ? 'white' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            {s}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Main Form */}
        <div className="card">
          <div className="card-body">
            {/* Step 1: Meeting Info */}
            {step === 1 && (
              <div>
                <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 700 }}>Meeting Information</h3>
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Meeting Name *</label>
                  <input
                    id="title" name="title" type="text"
                    className={`form-control ${errors.title ? 'error' : ''}`}
                    placeholder="e.g. Project Phoenix Review"
                    value={form.title} onChange={handleChange}
                  />
                  {errors.title && <div className="form-error">{errors.title}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Description</label>
                  <textarea
                    id="description" name="description"
                    className="form-control"
                    placeholder="What is this meeting about?"
                    value={form.description} onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="meeting_type">Meeting Type</label>
                    <select id="meeting_type" name="meeting_type" className="form-control" value={form.meeting_type} onChange={handleChange}>
                      {MEETING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="expected_duration_minutes">Expected Duration (min)</label>
                    <input
                      id="expected_duration_minutes" name="expected_duration_minutes" type="number"
                      className="form-control" min="15" max="480"
                      value={form.expected_duration_minutes} onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="scheduled_time">Date & Time</label>
                    <input
                      id="scheduled_time" name="scheduled_time" type="datetime-local"
                      className="form-control"
                      value={form.scheduled_time} onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="btn btn-primary" onClick={() => setStep(2)}>
                    Next: Languages →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Languages */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: 6, fontSize: 16, fontWeight: 700 }}>Language Configuration</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Select the speech language and the languages participants will use.
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="speech_language">Primary Speech Language</label>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                    The language participants will primarily speak in.
                  </p>
                  <select id="speech_language" name="speech_language" className="form-control" style={{ maxWidth: 280 }} value={form.speech_language} onChange={handleChange}>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.name} — {l.native}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Participant Languages</label>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Select all languages that participants need translations into.
                  </p>
                  {errors.languages && <div className="form-error" style={{ marginBottom: 8 }}>{errors.languages}</div>}
                  <div className="lang-chips">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        className={`lang-chip ${form.participant_languages.includes(l.code) ? 'selected' : ''}`}
                        onClick={() => toggleLanguage(l.code)}
                        aria-pressed={form.participant_languages.includes(l.code)}
                      >
                        {l.name} <span style={{ opacity: 0.7 }}>{l.native}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 8,
                  padding: '14px 16px',
                  marginTop: 16,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}>
                  <strong>Translation flow:</strong> Speech in {LANGUAGES.find(l => l.code === form.speech_language)?.name || 'English'} → 
                  {form.participant_languages.map(l => LANGUAGES.find(x => x.code === l)?.name).join(', ')}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Security →</button>
                </div>
              </div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
              <div>
                <h3 style={{ marginBottom: 6, fontSize: 16, fontWeight: 700 }}>Security Configuration</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Configure access control and data protection settings.
                </p>

                {/* Confidential Toggle */}
                <div className={`card ${form.is_confidential ? '' : ''}`} style={{
                  padding: '16px 18px',
                  marginBottom: 16,
                  background: form.is_confidential ? 'linear-gradient(135deg, #1a1a2e, #16213e)' : 'var(--bg)',
                  border: form.is_confidential ? '1px solid rgba(167,139,250,0.3)' : '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>🔐</span>
                      <div>
                        <div style={{ fontWeight: 600, color: form.is_confidential ? '#a78bfa' : 'var(--text-primary)' }}>
                          Confidential Meeting
                        </div>
                        <div style={{ fontSize: 12.5, color: form.is_confidential ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                          Restricted access with additional security controls
                        </div>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                      <input
                        type="checkbox"
                        name="is_confidential"
                        checked={form.is_confidential}
                        onChange={handleChange}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 12.5, color: form.is_confidential ? '#a78bfa' : 'var(--text-secondary)', fontWeight: 500 }}>
                        {form.is_confidential ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>

                {form.is_confidential && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="meeting_pin">Meeting PIN *</label>
                      <input
                        id="meeting_pin" name="meeting_pin" type="text"
                        className={`form-control ${errors.meeting_pin ? 'error' : ''}`}
                        placeholder="e.g. 1234" maxLength={10}
                        value={form.meeting_pin} onChange={handleChange}
                        style={{ maxWidth: 200 }}
                      />
                      {errors.meeting_pin && <div className="form-error">{errors.meeting_pin}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                        <input type="checkbox" name="require_approval" checked={form.require_approval} onChange={handleChange} />
                        Require participant approval
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                        <input type="checkbox" name="encrypted_storage" checked={form.encrypted_storage} onChange={handleChange} />
                        Encrypted transcript storage
                      </label>
                    </div>

                    <div className="form-group" style={{ marginTop: 14 }}>
                      <label className="form-label" htmlFor="session_timeout_minutes">Session Timeout (minutes, optional)</label>
                      <input
                        id="session_timeout_minutes" name="session_timeout_minutes" type="number"
                        className="form-control" min="5" max="120"
                        placeholder="e.g. 30"
                        value={form.session_timeout_minutes} onChange={handleChange}
                        style={{ maxWidth: 200 }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  <strong>All meetings include:</strong> JWT authentication · Role-based access · Audit logging · HTTPS
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ gap: 8 }}
                  >
                    {loading ? (
                      <><div className="loading-spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Creating...</>
                    ) : '✓ Create Meeting'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Meeting Preview</div>
            </div>
            <div className="card-body" style={{ fontSize: 13.5 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>TITLE</div>
                <div style={{ fontWeight: 600 }}>{form.title || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>TYPE</div>
                <div>{MEETING_TYPES.find(t => t.value === form.meeting_type)?.label}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>DURATION</div>
                <div>{form.expected_duration_minutes} minutes</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>SPEECH LANGUAGE</div>
                <div>{LANGUAGES.find(l => l.code === form.speech_language)?.name}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>PARTICIPANT LANGUAGES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.participant_languages.map((l) => (
                    <span key={l} className="badge badge-primary" style={{ fontSize: 11 }}>
                      {LANGUAGES.find(x => x.code === l)?.name || l}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>SECURITY</div>
                {form.is_confidential
                  ? <span className="badge badge-confidential">🔐 Confidential</span>
                  : <span className="badge badge-muted">Standard</span>}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-body" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>AI capabilities included:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Real-time transcription', 'Speaker identification', 'Multilingual translation', 'AI meeting summary', 'Action item extraction', 'Post-meeting Q&A'].map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
