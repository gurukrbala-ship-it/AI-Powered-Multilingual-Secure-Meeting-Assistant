import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const LANG_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', preferred_language: user?.preferred_language || 'en' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateMe(form);
      updateUser(form);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Personal Information</div></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="text" className="form-control" value={user?.email} disabled readOnly />
                <div className="form-hint">Email cannot be changed.</div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="preferred_language">Preferred Language</label>
                <select
                  id="preferred_language"
                  className="form-control"
                  style={{ maxWidth: 250 }}
                  value={form.preferred_language}
                  onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                >
                  {LANG_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, margin: '0 auto 14px',
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
              <span className="badge badge-primary" style={{ marginTop: 8 }}>{user?.role}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Account Info</div></div>
            <div className="card-body" style={{ fontSize: 13.5 }}>
              {[
                ['Role', user?.role],
                ['Status', user?.is_active ? 'Active' : 'Inactive'],
                ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
