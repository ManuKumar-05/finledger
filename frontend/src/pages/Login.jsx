// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import s from './Login.module.css';

const DEMO = [
  { name: 'Alice Chen',    username: 'admin',   password: 'admin123',   role: 'admin',   color: 'yellow' },
  { name: 'Bob Rodriguez', username: 'analyst', password: 'analyst123', role: 'analyst', color: 'blue' },
  { name: 'Carol Smith',   username: 'viewer',  password: 'viewer123',  role: 'viewer',  color: 'purple' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupDone, setSetupDone] = useState(true); // assume setup done

  useEffect(() => {
    api.get('/auth/setup-status')
      .then(r => setSetupDone(r.data.data.setupComplete))
      .catch(() => setSetupDone(true));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Both fields are required.'); return; }
    setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      toast('Welcome back!', 'success');
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  }

  function quickLogin(u, p) { setForm({ username: u, password: p }); setError(''); }

  return (
    <div className={s.page}>
      <div className={s.glow1} /><div className={s.glow2} />
      <div className={s.card}>
        <div className={s.logo}>Fin<span>Ledger</span></div>
        <p className={s.sub}>FINANCE DASHBOARD SYSTEM</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <label className={s.label}>Username</label>
          <input className={s.input} placeholder="Enter username"
            value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} />
          <label className={s.label}>Password</label>
          <input className={s.input} type="password" placeholder="Enter password"
            value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
          {error && <div className={s.error}>{error}</div>}
          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {!setupDone && (
          <div className={s.registerHint}>
            No admin registered yet.{' '}
            <Link to="/register" className={s.registerLink}>Create admin account →</Link>
          </div>
        )}

        <div className={s.demo}>
          <div className={s.demoTitle}>Quick Access — Demo Accounts</div>
          {DEMO.map(d => (
            <div key={d.username} className={s.demoRow} onClick={() => quickLogin(d.username, d.password)}>
              <div>
                <div className={s.demoName}>{d.name}</div>
                <div className={s.demoCred}>{d.username} / {d.password}</div>
              </div>
              <span className={`${s.roleBadge} ${s[d.color]}`}>{d.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
