import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/components/auth.css';

export default function Register() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', {
        email: form.email,
        password: form.password,
      }, { withCredentials: true });
      loginSuccess(data.accessToken, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">ᨒ</span>
          <span className="auth-brand-name">Ascendly</span>
        </div>
        <div className="auth-title">Create your account</div>
        <div className="auth-sub">Start your journey</div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-link-row">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
