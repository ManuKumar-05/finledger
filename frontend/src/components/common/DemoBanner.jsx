// src/components/common/DemoBanner.jsx
// Sticky banner shown to demo users on every page.
// Tells them they're in a sandbox and nudges them to register.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import s from './DemoBanner.module.css';

export default function DemoBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Only show to demo users
  if (!user || user.is_demo !== 1 || dismissed) return null;

  return (
    <div className={s.banner}>
      <div className={s.left}>
        <span className={s.pill}>DEMO</span>
        <span className={s.msg}>
          You're exploring a <strong>read-only demo sandbox</strong> with sample data.
          No changes will be saved.
        </span>
      </div>
      <div className={s.right}>
        <button className={s.registerBtn} onClick={() => navigate('/register')}>
          Create Your Free Account →
        </button>
        <button className={s.dismissBtn} onClick={() => setDismissed(true)} title="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
