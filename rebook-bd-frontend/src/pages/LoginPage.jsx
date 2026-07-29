import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [apiError, setApiErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setApiErr('');
    setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setApiErr(err.response?.data?.error ?? 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">Log in with your IUB email.</div>

        {apiError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{apiError}</div>}

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">University email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              onKeyDown={handleKey}
              placeholder="yourid@iub.edu.bd"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              onKeyDown={handleKey}
              placeholder="Your password"
            />
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </div>

        <div className="auth-footer">
          No account yet? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
