import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate    = useNavigate();
  const { login }   = useAuth();
  const [form, setForm]       = useState({ full_name:'', email:'', department:'', password:'', confirm_password:'' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setErrors({}); setApiErr('');
    const nextErrors = {};
    if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (!form.department.trim()) nextErrors.department = 'Department is required.';
    if (!form.password) nextErrors.password = 'Password is required.';
    if (form.password && form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (!form.confirm_password) nextErrors.confirm_password = 'Please confirm your password.';
    if (form.password && form.confirm_password && form.password !== form.confirm_password) {
      nextErrors.confirm_password = 'Passwords do not match.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        department: form.department,
        password: form.password,
      });
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
            {errors.department && <span className="form-error">{errors.department}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              className="form-input"
              type="password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
              placeholder="Re-enter your password"
            />
            {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
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
