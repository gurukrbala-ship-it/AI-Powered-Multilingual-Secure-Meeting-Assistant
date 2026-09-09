import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.3 }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">← Go to Dashboard</Link>
    </div>
  );
}
