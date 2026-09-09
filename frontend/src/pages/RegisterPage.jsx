import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'participant',
    preferred_language: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role, form.preferred_language);
      toast.success('Account created! Welcome to LinguaMeet AI.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--primary)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 24, marginBottom: 12,
          }}>✦</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>LinguaMeet AI</div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join LinguaMeet AI and break language barriers in meetings</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name" name="name" type="text"
              className={`form-control ${errors.name ? 'error' : ''}`}
              placeholder="Your full name"
              value={form.name} onChange={handleChange}
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Min 8 characters"
                value={form.password} onChange={handleChange}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password"
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange}
              />
              {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select
                id="role" name="role"
                className="form-control"
                value={form.role} onChange={handleChange}
              >
                <option value="participant">Participant</option>
                <option value="host">Meeting Host</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="preferred_language">Preferred language</label>
              <select
                id="preferred_language" name="preferred_language"
                className="form-control"
                value={form.preferred_language} onChange={handleChange}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14.5 }}
          >
            {loading ? (
              <><div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Creating account...</>
            ) : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          By creating an account you agree to our terms of service.
        </div>
      </div>
    </div>
  );
}
