import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SecurityPage() {
  const { isDemoMode } = useAuth();

  const features = [
    {
      icon: '🔑',
      title: 'JWT Authentication',
      desc: 'All API requests require a valid JSON Web Token. Tokens expire after 24 hours.',
      status: 'active',
    },
    {
      icon: '👥',
      title: 'Role-Based Access Control',
      desc: 'Three tiers: Admin, Host, Participant. Each has distinct permissions enforced at the API level.',
      status: 'active',
    },
    {
      icon: '🔐',
      title: 'Password Hashing',
      desc: 'All passwords are hashed using bcrypt with salt rounds. No plaintext passwords are stored.',
      status: 'active',
    },
    {
      icon: '🛡',
      title: 'Confidential Meeting Mode',
      desc: 'Meeting-level PIN protection, participant approval queue, and encrypted storage flags.',
      status: 'active',
    },
    {
      icon: '📋',
      title: 'Audit Logging',
      desc: 'Every significant action is recorded with user, timestamp, and IP address.',
      status: 'active',
    },
    {
      icon: '🌐',
      title: 'CORS Protection',
      desc: 'API restricts cross-origin requests to configured trusted origins.',
      status: 'active',
    },
    {
      icon: '⚡',
      title: 'Rate Limiting',
      desc: 'API endpoints are rate-limited to prevent abuse.',
      status: 'active',
    },
    {
      icon: '💉',
      title: 'SQL Injection Protection',
      desc: 'SQLAlchemy ORM with parameterized queries prevents SQL injection attacks.',
      status: 'active',
    },
    {
      icon: '✅',
      title: 'Input Validation',
      desc: 'All API inputs are validated via Pydantic schemas before processing.',
      status: 'active',
    },
    {
      icon: '🔒',
      title: 'HTTPS/TLS Ready',
      desc: 'Application is designed for HTTPS deployment. Configure TLS at the reverse proxy layer.',
      status: 'deployment',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Security Overview</h1>
        <p className="page-subtitle">Security architecture and controls for LinguaMeet AI</p>
      </div>

      <div className="grid grid-2">
        <div>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '16px 0',
              borderBottom: '1px solid var(--border-light)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: f.status === 'active' ? '#d1fae5' : '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.title}</div>
                  <span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                    {f.status === 'active' ? '✓ Active' : 'Deploy config'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Security Architecture</div></div>
            <div className="card-body" style={{ fontSize: 13, lineHeight: 1.7 }}>
              <pre style={{
                background: '#0f172a', color: '#94a3b8',
                padding: 16, borderRadius: 8,
                fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap',
              }}>
{`User Browser
    ↓ HTTPS
React Frontend
    ↓ JWT Bearer Token
FastAPI Backend
    ↓
┌───────────────────────────┐
│ JWT Auth Middleware        │
│ Role-Based Access Control  │
│ Rate Limiting              │
│ Input Validation           │
└───────────────────────────┘
    ↓
Meeting Service Layer
    ↓
PostgreSQL (bcrypt hashes)
    ↓
Audit Log (every action)`}
              </pre>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Confidential Meeting Controls</div></div>
            <div className="card-body" style={{ fontSize: 13.5 }}>
              {[
                'PIN/Passcode required to join',
                'Host approval queue for participants',
                'Encrypted transcript storage flag',
                'Automatic session timeout',
                'Role-based transcript access',
                'Full audit trail per meeting',
              ].map((item) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 0', borderBottom: '1px solid var(--border-light)',
                }}>
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
