// src/components/common/FreshStart.jsx
// Shown on Dashboard when a new real admin logs in with zero records

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { recordsAPI, usersAPI } from '../../utils/api';
import { todayISO, CATEGORIES, capitalize } from '../../utils/format';
import s from './FreshStart.module.css';

const QUICK_RECORDS = [
  { description: 'Monthly Salary',   amount: 50000, type: 'income',  category: 'salary',    notes: 'Primary income' },
  { description: 'House Rent',       amount: 12000, type: 'expense', category: 'utilities', notes: 'Monthly rent' },
  { description: 'Grocery Shopping', amount: 3500,  type: 'expense', category: 'food',      notes: '' },
];

const STEPS = [
  { id: 'records',  icon: '≡',  title: 'Add your first records',  desc: 'Start tracking income and expenses' },
  { id: 'team',     icon: '◎',  title: 'Invite your team',        desc: 'Create Analyst or Viewer accounts' },
  { id: 'explore',  icon: '◉',  title: 'Explore analytics',       desc: 'See trends once you have data' },
];

export default function FreshStart({ onDismiss }) {
  const { user } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();
  const [seeding,  setSeeding]  = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invForm,  setInvForm]  = useState({ name:'', username:'', email:'', password:'', role:'analyst' });
  const [invErr,   setInvErr]   = useState({});
  const [showInv,  setShowInv]  = useState(false);
  const [done,     setDone]     = useState({ records: false, team: false });

  // Seed 3 starter records for the new user
  async function addStarterRecords() {
    setSeeding(true);
    try {
      const today = todayISO();
      for (const r of QUICK_RECORDS) {
        await recordsAPI.create({ ...r, date: today });
      }
      toast('3 starter records added! Your dashboard is now live.', 'success');
      setDone(d => ({ ...d, records: true }));
      setTimeout(() => onDismiss(), 800);
    } catch { toast('Could not add records. Try manually.', 'error'); }
    setSeeding(false);
  }

  function validateInv() {
    const e = {};
    if (!invForm.name.trim())            e.name     = 'Required';
    if (!invForm.username.trim())        e.username = 'Required';
    if (!invForm.email.includes('@'))    e.email    = 'Valid email required';
    if (invForm.password.length < 6)     e.password = 'Min 6 characters';
    setInvErr(e);
    return Object.keys(e).length === 0;
  }

  async function sendInvite() {
    if (!validateInv()) return;
    setInviting(true);
    try {
      await usersAPI.create({ ...invForm });
      toast(`${invForm.name} invited as ${invForm.role}!`, 'success');
      setDone(d => ({ ...d, team: true }));
      setShowInv(false);
      setInvForm({ name:'', username:'', email:'', password:'', role:'analyst' });
    } catch (err) {
      toast(err.response?.data?.message || 'Invite failed', 'error');
    }
    setInviting(false);
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className={s.wrap}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.avatar}>
          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
        </div>
        <div>
          <h1 className={s.greeting}>Welcome, {firstName}! 👋</h1>
          <p className={s.sub}>Your FinLedger workspace is ready. Here's how to get started.</p>
        </div>
        <button className={s.skipBtn} onClick={onDismiss}>Skip setup →</button>
      </div>

      {/* Progress steps */}
      <div className={s.stepsRow}>
        {STEPS.map((st) => (
          <div key={st.id} className={`${s.stepCard} ${done[st.id] ? s.stepDone : ''}`}>
            <div className={s.stepIcon}>{done[st.id] ? '✓' : st.icon}</div>
            <div className={s.stepTitle}>{st.title}</div>
            <div className={s.stepDesc}>{st.desc}</div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className={s.actions}>

        {/* Card 1 — Add records */}
        <div className={`${s.card} ${done.records ? s.cardDone : ''}`}>
          <div className={s.cardHead}>
            <div className={s.cardIcon} style={{ background:'rgba(0,229,180,0.1)', color:'#00e5b4' }}>≡</div>
            <div>
              <div className={s.cardTitle}>Add your first financial records</div>
              <div className={s.cardDesc}>Start tracking income & expenses right now</div>
            </div>
          </div>

          <div className={s.sampleList}>
            {QUICK_RECORDS.map((r, i) => (
              <div key={i} className={s.sampleRow}>
                <span className={s.sampleName}>{r.description}</span>
                <span className={s.sampleAmt} style={{ color: r.type==='income' ? '#00e5b4' : '#ff4d6a' }}>
                  {r.type==='income' ? '+' : '-'}₹{r.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className={s.cardActions}>
            <button className={s.btnAccent} onClick={addStarterRecords} disabled={seeding || done.records}>
              {seeding ? 'Adding…' : done.records ? '✓ Added!' : '+ Add these 3 sample records'}
            </button>
            <button className={s.btnGhost} onClick={() => navigate('/app/records')}>
              Add manually →
            </button>
          </div>
        </div>

        {/* Card 2 — Invite team */}
        <div className={`${s.card} ${done.team ? s.cardDone : ''}`}>
          <div className={s.cardHead}>
            <div className={s.cardIcon} style={{ background:'rgba(77,159,255,0.1)', color:'#4d9fff' }}>◎</div>
            <div>
              <div className={s.cardTitle}>Invite your team</div>
              <div className={s.cardDesc}>Create accounts for analysts and viewers</div>
            </div>
          </div>

          {!showInv ? (
            <div className={s.roleOptions}>
              <div className={s.roleInfo}>
                <div className={s.roleChip + ' ' + s.analyst}>Analyst</div>
                <span className={s.roleCaption}>Can view records & analytics</span>
              </div>
              <div className={s.roleInfo}>
                <div className={s.roleChip + ' ' + s.viewer}>Viewer</div>
                <span className={s.roleCaption}>Read-only access to records</span>
              </div>
              <div className={s.cardActions}>
                <button className={s.btnBlue} onClick={() => setShowInv(true)} disabled={done.team}>
                  {done.team ? '✓ Team member added!' : '+ Invite a team member'}
                </button>
                <button className={s.btnGhost} onClick={() => navigate('/app/users')}>
                  Manage users →
                </button>
              </div>
            </div>
          ) : (
            <div className={s.inviteForm}>
              <div className={s.invRow}>
                <div className={s.invField}>
                  <label className={s.invLabel}>Name</label>
                  <input className={`${s.invInput} ${invErr.name?s.invInputErr:''}`}
                    placeholder="Full name" value={invForm.name}
                    onChange={e => setInvForm(f=>({...f,name:e.target.value}))} />
                  {invErr.name && <div className={s.invErr}>{invErr.name}</div>}
                </div>
                <div className={s.invField}>
                  <label className={s.invLabel}>Username</label>
                  <input className={`${s.invInput} ${invErr.username?s.invInputErr:''}`}
                    placeholder="username" value={invForm.username}
                    onChange={e => setInvForm(f=>({...f,username:e.target.value.toLowerCase().replace(/\s/g,'')}))} />
                  {invErr.username && <div className={s.invErr}>{invErr.username}</div>}
                </div>
              </div>
              <div className={s.invRow}>
                <div className={s.invField}>
                  <label className={s.invLabel}>Email</label>
                  <input className={`${s.invInput} ${invErr.email?s.invInputErr:''}`}
                    type="email" placeholder="email@example.com" value={invForm.email}
                    onChange={e => setInvForm(f=>({...f,email:e.target.value}))} />
                  {invErr.email && <div className={s.invErr}>{invErr.email}</div>}
                </div>
                <div className={s.invField}>
                  <label className={s.invLabel}>Password</label>
                  <input className={`${s.invInput} ${invErr.password?s.invInputErr:''}`}
                    type="password" placeholder="Min 6 chars" value={invForm.password}
                    onChange={e => setInvForm(f=>({...f,password:e.target.value}))} />
                  {invErr.password && <div className={s.invErr}>{invErr.password}</div>}
                </div>
              </div>
              <div className={s.invField}>
                <label className={s.invLabel}>Role</label>
                <select className={s.invInput} value={invForm.role}
                  onChange={e => setInvForm(f=>({...f,role:e.target.value}))}>
                  <option value="analyst">Analyst — view records + analytics</option>
                  <option value="viewer">Viewer — read only</option>
                </select>
              </div>
              <div className={s.cardActions}>
                <button className={s.btnBlue} onClick={sendInvite} disabled={inviting}>
                  {inviting ? 'Creating…' : 'Create account'}
                </button>
                <button className={s.btnGhost} onClick={() => { setShowInv(false); setInvErr({}); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 3 — Explore */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <div className={s.cardIcon} style={{ background:'rgba(167,139,250,0.1)', color:'#a78bfa' }}>◉</div>
            <div>
              <div className={s.cardTitle}>Explore what's available</div>
              <div className={s.cardDesc}>Every feature at your fingertips</div>
            </div>
          </div>
          <div className={s.featureList}>
            {[
              { icon:'◈', label:'Dashboard',    path:'/app/dashboard', desc:'Charts & summaries' },
              { icon:'≡', label:'Records',      path:'/app/records',   desc:'CRUD + filters' },
              { icon:'◉', label:'Analytics',    path:'/app/analytics', desc:'Trends & KPIs' },
              { icon:'◎', label:'User Mgmt',    path:'/app/users',     desc:'Team access control' },
            ].map(f => (
              <div key={f.path} className={s.featureRow} onClick={() => navigate(f.path)}>
                <span className={s.featureIcon}>{f.icon}</span>
                <div className={s.featureInfo}>
                  <span className={s.featureLabel}>{f.label}</span>
                  <span className={s.featureDesc}>{f.desc}</span>
                </div>
                <span className={s.featureArrow}>→</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom dismiss */}
      <div className={s.bottomRow}>
        <button className={s.dismissBtn} onClick={onDismiss}>
          I'm set up — take me to the dashboard →
        </button>
      </div>
    </div>
  );
}
