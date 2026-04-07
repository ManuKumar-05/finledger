// src/pages/Welcome.jsx
// Public landing/welcome screen — shown before login

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import s from './Welcome.module.css';

const FEATURES = [
  { icon: '◈', title: 'Live Dashboard',     desc: 'Real-time income, expense totals, category breakdowns, and net balance.' },
  { icon: '≡', title: 'Full CRUD Records',  desc: 'Create, filter, paginate, update, and soft-delete financial entries.' },
  { icon: '◉', title: 'Analytics & KPIs',   desc: 'Monthly trends, weekly charts, savings rate, and top category insights.' },
  { icon: '◎', title: 'User Management',    desc: 'Invite users, assign roles, activate or deactivate accounts instantly.' },
  { icon: '⚿', title: 'JWT Auth & Guards',  desc: 'Secure token-based authentication with per-route role enforcement.' },
  { icon: '⚡', title: 'Swagger API Docs',   desc: 'Every endpoint documented and testable at /api/docs.' },
];

const ROLES = [
  { initials: 'AC', name: 'Alice Chen',    role: 'admin',   username: 'admin',   password: 'admin123',   desc: 'Full access — CRUD, users, analytics', color: 'yellow' },
  { initials: 'BR', name: 'Bob Rodriguez', role: 'analyst', username: 'analyst', password: 'analyst123', desc: 'Read records + analytics', color: 'blue' },
  { initials: 'CS', name: 'Carol Smith',   role: 'viewer',  username: 'viewer',  password: 'viewer123',  desc: 'Read-only access', color: 'purple' },
];

const STATS = [
  { num: '35+', label: 'Sample Records' },
  { num: '3',   label: 'Role Levels' },
  { num: '16',  label: 'API Endpoints' },
  { num: '6',   label: 'Dashboard APIs' },
];

export default function Welcome() {
  const navigate  = useNavigate();
  const { user, login }   = useAuth();
  const heroRef   = useRef(null);

  const [setupComplete, setSetupComplete] = useState(null); // null = loading

  // Redirect if already logged in
  useEffect(() => { if (user) navigate('/app/dashboard'); }, [user]);

  // Check if a real admin has registered yet
  useEffect(() => {
    api.get('/auth/setup-status')
      .then(r => setSetupComplete(r.data.data.setupComplete))
      .catch(() => setSetupComplete(true)); // on error, assume setup done → show login
  }, []);

  // Parallax orb on mouse move
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handler = (e) => {
      const { left, top, width, height } = hero.getBoundingClientRect();
      const x = ((e.clientX - left) / width  - 0.5) * 20;
      const y = ((e.clientY - top)  / height - 0.5) * 20;
      hero.style.setProperty('--ox', `${x}px`);
      hero.style.setProperty('--oy', `${y}px`);
    };
    hero.addEventListener('mousemove', handler);
    return () => hero.removeEventListener('mousemove', handler);
  }, []);

  async function quickLogin(username, password) {
    try { await login(username, password); navigate('/dashboard'); } catch {}
  }

  return (
    <div className={s.page} ref={heroRef}>
      {/* Background orbs */}
      <div className={s.orb1} />
      <div className={s.orb2} />
      <div className={s.orb3} />
      <div className={s.grid} />

      {/* NAV */}
      <nav className={s.nav}>
        <div className={s.logo}>Fin<span>Ledger</span></div>
        <div className={s.navLinks}>
          <a href="#features" className={s.navLink}>Features</a>
          <a href="#roles"    className={s.navLink}>Roles</a>
          <a href="https://github.com/manukumar-05/finledger" className={s.navLink} target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <button className={s.navCta} onClick={() => navigate(setupComplete === false ? '/register' : '/login')}>
          {setupComplete === false ? 'Get Started' : 'Sign In →'}
        </button>
      </nav>

      {/* HERO */}
      <section className={s.hero}>
        <div className={`${s.badge} ${s.fadeUp}`} style={{ animationDelay: '0s' }}>
          <span className={s.badgeDot} />
          FINANCE DASHBOARD SYSTEM
        </div>

        <h1 className={`${s.heroTitle} ${s.fadeUp}`} style={{ animationDelay: '0.1s' }}>
          Manage your<br />
          <span className={s.accent}>finances</span> with<br />
          <span className={s.accentBlue}>clarity</span>
        </h1>

        <p className={`${s.heroSub} ${s.fadeUp}`} style={{ animationDelay: '0.2s' }}>
          A role-based finance dashboard for tracking income, expenses, and
          insights — built for teams with full access control.
        </p>

        <div className={`${s.heroActions} ${s.fadeUp}`} style={{ animationDelay: '0.3s' }}>
          {setupComplete === false ? (
            <button className={s.btnMain} onClick={() => navigate('/register')}>
              Create Admin Account →
            </button>
          ) : (
            <button className={s.btnMain} onClick={() => navigate('/login')}>
              Sign In →
            </button>
          )}
          
        </div>

        {/* Stats */}
        <div className={`${s.statsRow} ${s.fadeUp}`} style={{ animationDelay: '0.45s' }}>
          {STATS.map((st, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={s.statDiv} />}
              <div className={s.stat}>
                <div className={s.statNum}>{st.num}</div>
                <div className={s.statLabel}>{st.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className={`${s.section} ${s.fadeUp}`} style={{ animationDelay: '0.55s' }}>
        <div className={s.sectionLabel}>What's inside</div>
        <h2 className={s.sectionTitle}>Everything you need</h2>
        <div className={s.featGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={s.featCard} style={{ animationDelay: (0.6 + i * 0.07) + 's' }}>
              <div className={s.featIcon}>{f.icon}</div>
              <div className={s.featTitle}>{f.title}</div>
              <div className={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className={`${s.section} ${s.fadeUp}`} style={{ animationDelay: '0.65s' }}>
        <div className={s.sectionLabel}>Access control</div>
        <h2 className={s.sectionTitle}>Three role levels</h2>
        <p className={s.sectionSub}>Click any role to instantly demo that access level</p>
        <div className={s.rolesGrid}>
          {ROLES.map((r) => (
            <div key={r.role} className={`${s.roleCard} ${s[r.color]}`}
              onClick={() => quickLogin(r.username, r.password)}>
              <div className={s.roleTop}>
                <div className={`${s.roleAv} ${s['av_' + r.color]}`}>{r.initials}</div>
                <div>
                  <div className={s.roleName}>{r.name}</div>
                  <div className={s.roleUsername}>@{r.username} · {r.password}</div>
                </div>
                <span className={`${s.roleBadge} ${s['rb_' + r.color]}`}>{r.role}</span>
              </div>
              <div className={s.roleDesc}>{r.desc}</div>
              <div className={s.roleAction}>Click to demo →</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className={`${s.ctaSection} ${s.fadeUp}`} style={{ animationDelay: '0.7s' }}>
        <h2 className={s.ctaTitle}>Ready to explore?</h2>
        <p className={s.ctaSub}>Sign in with any demo account to see the full dashboard.</p>
        <button className={s.btnMain} onClick={() => navigate(setupComplete === false ? '/register' : '/login')}>
          {setupComplete === false ? 'Create Admin Account →' : 'Open Dashboard →'}
        </button>
      </section>

      <footer className={s.footer}>
        <span>FinLedger · Built with Node.js, Express, SQLite & React</span>
        <span className={s.footerRight}>
          <a href="https://github.com/manukumar-05/finledger" className={s.footerLink} target="_blank" rel="noreferrer">GitHub</a>
          {' · '}
          <a href="/api/docs" className={s.footerLink} target="_blank" rel="noreferrer">API Docs</a>
        </span>
      </footer>
    </div>
  );
}
