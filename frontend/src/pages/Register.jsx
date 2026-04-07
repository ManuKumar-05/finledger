// src/pages/Register.jsx
// First-time admin registration — multi-step form

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import s from './Register.module.css';

const STEPS = [
  { id: 1, label: 'Your Identity',  icon: '◈' },
  { id: 2, label: 'Login Details',  icon: '⚿' },
  { id: 3, label: 'Ready to Go',    icon: '◉' },
];

const EMPTY = { name: '', username: '', email: '', password: '', confirm: '' };

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const toast     = useToast();

  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [checking,setChecking]= useState(true);

  // Guard: if a real admin already exists → redirect to login
  useEffect(() => {
    api.get('/auth/setup-status').then(r => {
      if (r.data.data.setupComplete) {
        toast('An admin already exists. Please log in.', 'info');
        navigate('/login');
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); }

  /* ── Per-step validation ── */
  function validateStep(n) {
    const e = {};
    if (n === 1) {
      if (!form.name.trim())               e.name     = 'Full name is required';
      if (!form.email.includes('@'))       e.email    = 'Enter a valid email address';
    }
    if (n === 2) {
      if (!form.username.trim())           e.username = 'Username is required';
      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Only letters, numbers, underscores';
      if (form.username.length < 3)        e.username = e.username || 'Min 3 characters';
      if (form.password.length < 6)        e.password = 'Min 6 characters';
      if (form.confirm !== form.password)  e.confirm  = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() { if (validateStep(step)) setStep(s => s + 1); }
  function prevStep() { setStep(s => s - 1); }

  async function submit() {
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name:     form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      // Auto-login after register
      await login(form.username.trim().toLowerCase(), form.password);
      toast('Welcome to FinLedger! Your admin account is ready.', 'success');
      navigate('/app/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      toast(msg, 'error');
      if (msg.toLowerCase().includes('username') || msg.toLowerCase().includes('email')) {
        setStep(2);
        setErrors({ username: msg });
      }
    } finally { setLoading(false); }
  }

  if (checking) return (
    <div className={s.page}>
      <div className={s.spinner} />
    </div>
  );

  const strengthScore = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['','Weak','Fair','Good','Strong','Very Strong'][strengthScore] || '';
  const strengthColor = ['','#ff4d6a','#f5c842','#4d9fff','#00e5b4','#00e5b4'][strengthScore] || '';

  return (
    <div className={s.page}>
      <div className={s.orb1} /><div className={s.orb2} /><div className={s.grid} />

      {/* Nav */}
      <nav className={s.nav}>
        <div className={s.logo}>Fin<span>Ledger</span></div>
        <Link to="/login" className={s.navLink}>Already have an account? Sign in →</Link>
      </nav>

      <div className={s.wrap}>
        {/* Left panel */}
        <div className={s.left}>
          <div className={s.leftBadge}>FIRST-TIME SETUP</div>
          <h1 className={s.leftTitle}>Set up your<br/><span>admin account</span></h1>
          <p className={s.leftSub}>
            You're the first person here. Create your admin account to get started —
            then invite your team from the Users page.
          </p>

          {/* Stepper */}
          <div className={s.stepper}>
            {STEPS.map((st, i) => (
              <div key={st.id} className={s.stepRow}>
                <div className={`${s.stepDot} ${step > st.id ? s.done : step === st.id ? s.active : s.idle}`}>
                  {step > st.id ? '✓' : st.icon}
                </div>
                <div className={s.stepInfo}>
                  <div className={s.stepLabel}>{st.label}</div>
                  {step === st.id && <div className={s.stepCurrent}>Current step</div>}
                </div>
                {i < STEPS.length - 1 && <div className={`${s.stepLine} ${step > st.id ? s.lineDone : ''}`} />}
              </div>
            ))}
          </div>

          {/* What happens next */}
          <div className={s.infoBox}>
            <div className={s.infoTitle}>What happens next?</div>
            <div className={s.infoRow}><span className={s.infoCheck}>✓</span> You get full admin access</div>
            <div className={s.infoRow}><span className={s.infoCheck}>✓</span> Create Analyst & Viewer accounts from Users page</div>
            <div className={s.infoRow}><span className={s.infoCheck}>✓</span> Start with a clean, empty dashboard</div>
            <div className={s.infoRow}><span className={s.infoCheck}>✓</span> Demo accounts remain separately available</div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className={s.right}>
          <div className={s.card}>
            {/* Progress bar */}
            <div className={s.progress}>
              <div className={s.progressBar} style={{ width: `${((step-1)/2)*100}%` }} />
            </div>

            <div className={s.stepHeader}>
              <div className={s.stepNum}>Step {step} of 3</div>
              <div className={s.stepTitle}>{STEPS[step-1].label}</div>
            </div>

            {/* ── Step 1: Identity ── */}
            {step === 1 && (
              <div className={s.fields}>
                <div className={s.field}>
                  <label className={s.label}>Full Name *</label>
                  <input className={`${s.input} ${errors.name ? s.inputErr : ''}`}
                    placeholder="e.g. Jane Doe"
                    value={form.name} onChange={e => set('name', e.target.value)}
                    autoFocus />
                  {errors.name && <div className={s.err}>{errors.name}</div>}
                </div>
                <div className={s.field}>
                  <label className={s.label}>Work Email *</label>
                  <input className={`${s.input} ${errors.email ? s.inputErr : ''}`}
                    type="email" placeholder="you@yourcompany.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <div className={s.err}>{errors.email}</div>}
                </div>
                <div className={s.hint}>
                  This email will be your primary contact for the account.
                </div>
              </div>
            )}

            {/* ── Step 2: Credentials ── */}
            {step === 2 && (
              <div className={s.fields}>
                <div className={s.field}>
                  <label className={s.label}>Username *</label>
                  <div className={s.inputWrap}>
                    <span className={s.inputPrefix}>@</span>
                    <input className={`${s.input} ${s.inputPrefixed} ${errors.username ? s.inputErr : ''}`}
                      placeholder="yourname"
                      value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))}
                      autoFocus />
                  </div>
                  {errors.username
                    ? <div className={s.err}>{errors.username}</div>
                    : <div className={s.hint}>Letters, numbers, underscores only. This is your login ID.</div>
                  }
                </div>
                <div className={s.field}>
                  <label className={s.label}>Password *</label>
                  <input className={`${s.input} ${errors.password ? s.inputErr : ''}`}
                    type="password" placeholder="Min 6 characters"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  {form.password && (
                    <div className={s.strengthRow}>
                      <div className={s.strengthTrack}>
                        <div className={s.strengthFill}
                          style={{ width: `${(strengthScore/5)*100}%`, background: strengthColor }} />
                      </div>
                      <span className={s.strengthLabel} style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                  {errors.password && <div className={s.err}>{errors.password}</div>}
                </div>
                <div className={s.field}>
                  <label className={s.label}>Confirm Password *</label>
                  <input className={`${s.input} ${errors.confirm ? s.inputErr : ''}`}
                    type="password" placeholder="Repeat your password"
                    value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                  {errors.confirm && <div className={s.err}>{errors.confirm}</div>}
                </div>
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className={s.review}>
                <div className={s.reviewAvatar}>
                  {form.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div className={s.reviewName}>{form.name}</div>
                <div className={s.reviewRole}>Administrator</div>
                <div className={s.reviewRows}>
                  <div className={s.reviewRow}>
                    <span className={s.reviewLabel}>Username</span>
                    <span className={s.reviewVal}>@{form.username}</span>
                  </div>
                  <div className={s.reviewRow}>
                    <span className={s.reviewLabel}>Email</span>
                    <span className={s.reviewVal}>{form.email}</span>
                  </div>
                  <div className={s.reviewRow}>
                    <span className={s.reviewLabel}>Role</span>
                    <span className={s.reviewBadge}>Admin</span>
                  </div>
                  <div className={s.reviewRow}>
                    <span className={s.reviewLabel}>Access</span>
                    <span className={s.reviewVal}>Full — CRUD, Users, Analytics</span>
                  </div>
                </div>
                <div className={s.reviewNote}>
                  Everything looks good? Hit "Create Account" to get started.
                  You can change your details later from your profile.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={s.actions}>
              {step > 1 && (
                <button className={s.btnBack} onClick={prevStep} disabled={loading}>
                  ← Back
                </button>
              )}
              {step < 3 && (
                <button className={s.btnNext} onClick={nextStep}>
                  Continue →
                </button>
              )}
              {step === 3 && (
                <button className={s.btnSubmit} onClick={submit} disabled={loading}>
                  {loading ? 'Creating account…' : '🚀 Create Account'}
                </button>
              )}
            </div>

            {step === 1 && (
              <div className={s.loginLink}>
                Already have an account?{' '}
                <Link to="/login" className={s.link}>Sign in</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
