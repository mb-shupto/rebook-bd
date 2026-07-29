import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate    = useNavigate();
  const { login }   = useAuth();
  const [form, setForm]       = useState({ full_name:'', email:'', password:'', department:'' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setErrors({}); setApiErr('');
    setLoading(true);
    try {
      await register(form);
      // Auto-login after register by hitting login endpoint
      const { login: loginApi } = await import('../api');
      const res = await loginApi({ email: form.email, password: form.password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setApiErr(data?.error ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">Create account</div>
        <div className="auth-subtitle">Use your IUB university email to join.</div>

        {apiError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{apiError}</div>}

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
            {errors.full_name && <span className="form-error">{errors.full_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">University email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="yourid@iub.edu.bd" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" value={form.department} onChange={set('department')} placeholder="e.g. CSE" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
