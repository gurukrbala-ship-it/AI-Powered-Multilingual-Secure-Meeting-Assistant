import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuToggle }) {
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  return (
    <header className="app-header">
      <button
        className="btn btn-icon btn-outline"
        onClick={onMenuToggle}
        style={{ display: 'none' }}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <div style={{ flex: 1 }}>
        <form onSubmit={handleSearch}>
          <div className="search-input">
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>⊙</span>
            <input
              type="text"
              placeholder="Search meetings, transcripts, actions..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              aria-label="Search"
            />
          </div>
        </form>
      </div>

      {isDemoMode && (
        <div style={{
          padding: '4px 10px',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          color: '#6366f1',
        }}>
          ⬡ DEMO MODE
        </div>
      )}

      <Link to="/notifications" className="btn btn-icon btn-outline" aria-label="Notifications">
        🔔
      </Link>

      <Link to="/profile" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          transition: 'all 200ms',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 12,
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>
              {user?.role}
            </div>
          </div>
        </div>
      </Link>
    </header>
  );
}
