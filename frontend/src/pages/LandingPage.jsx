import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: '🌐',
    title: 'Real-Time Translation',
    desc: 'Break language barriers instantly. Speech is translated into every participant\'s preferred language as it happens.',
  },
  {
    icon: '✦',
    title: 'AI Meeting Intelligence',
    desc: 'Automatically generate executive summaries, extract key decisions, and identify action items using IBM watsonx.ai.',
  },
  {
    icon: '💬',
    title: 'Ask Your Meeting',
    desc: 'Ask any question about completed meetings and receive grounded answers from the actual conversation.',
  },
  {
    icon: '👤',
    title: 'Speaker Identification',
    desc: 'Identify who said what. Every transcript segment is tagged with the speaker\'s name and timestamp.',
  },
  {
    icon: '🔐',
    title: 'Confidential Meeting Mode',
    desc: 'Protect sensitive discussions with role-based access, encrypted storage, and complete audit trails.',
  },
  {
    icon: '📋',
    title: 'Action Item Tracking',
    desc: 'Automatically extract tasks, assignees, and deadlines. Track progress with a built-in Kanban board.',
  },
];

const pipeline = [
  { label: 'Speech', icon: '🎙️' },
  { label: 'IBM STT', icon: '→' },
  { label: 'Speaker ID', icon: '→' },
  { label: 'Translate', icon: '→' },
  { label: 'watsonx.ai', icon: '→' },
  { label: 'Intelligence', icon: '→' },
  { label: 'AI Q&A', icon: '✦' },
];

const ibmServices = [
  { name: 'IBM watsonx.ai', desc: 'Generative AI for summaries, decisions, and Q&A' },
  { name: 'IBM Watson STT', desc: 'Enterprise-grade speech recognition' },
  { name: 'IBM Watson LT', desc: 'Multilingual translation' },
  { name: 'IBM Cloud', desc: 'Scalable cloud infrastructure' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="landing-hero">
        <nav className="landing-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 18,
            }}>✦</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>LinguaMeet AI</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Meeting Intelligence Platform</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-hero-primary" style={{ padding: '10px 22px', fontSize: 14 }}>
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-hero-outline" style={{ padding: '10px 22px', fontSize: 14 }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-hero-primary" style={{ padding: '10px 22px', fontSize: 14 }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <span>✦</span>
            Powered by IBM watsonx.ai
          </div>
          <h1 className="hero-title">
            Understand Every Voice.<br />
            <span>In Every Language.</span>
          </h1>
          <p className="hero-subtitle">
            An AI-powered multilingual meeting assistant that translates conversations in real time
            and transforms meetings into searchable, actionable knowledge.
          </p>
          <div className="hero-ctas">
            <Link to={isAuthenticated ? '/meetings/new' : '/register'} className="btn-hero-primary">
              Start a Meeting →
            </Link>
            <a href="#features" className="btn-hero-outline">
              Explore Features
            </a>
          </div>

          {/* AI Pipeline visual */}
          <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {pipeline.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: i === 0 || i === pipeline.length - 1
                    ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: i === 0 || i === pipeline.length - 1 ? 'white' : 'rgba(255,255,255,0.7)',
                }}>
                  {step.label}
                </div>
                {i < pipeline.length - 1 && (
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            A Secure AI Meeting Intelligence Platform
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
            Not just a translator — a complete meeting intelligence system that understands,
            summarizes, and answers questions about your meetings.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* IBM Technology Section */}
      <section style={{ background: 'var(--bg)', padding: '70px 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: '#001141',
              borderRadius: 4,
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: 16,
            }}>
              IBM TECHNOLOGY
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
              Enterprise AI, Securely Delivered
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Built on IBM's enterprise AI platform for reliability, security, and scalability.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {ibmServices.map((s, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                padding: 22,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', padding: '70px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 14 }}>
          Ready to break language barriers?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          Start your first multilingual meeting in minutes.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={isAuthenticated ? '/meetings/new' : '/register'} className="btn-hero-primary">
            Start a Meeting →
          </Link>
          <Link to="/login" className="btn-hero-outline">
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0f172a',
        color: 'rgba(255,255,255,0.4)',
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 13,
      }}>
        <div>© 2024 LinguaMeet AI — AI-Powered Multilingual Meeting Assistant</div>
        <div>Built with IBM watsonx.ai · Watson STT · Watson Language Translator</div>
      </footer>
    </div>
  );
}
