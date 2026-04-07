// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import s from './Sidebar.module.css';

const NAV = [
  { to: '/app/dashboard', icon: '◈', label: 'Dashboard',  roles: ['admin','analyst','viewer'] },
  { to: '/app/records',   icon: '≡', label: 'Records',    roles: ['admin','analyst','viewer'] },
  { to: '/app/analytics', icon: '◉', label: 'Analytics',  roles: ['admin','analyst'] },
  { to: '/app/users',     icon: '◎', label: 'Users',      roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'FL';
  const roleBadge = { admin:'yellow', analyst:'blue', viewer:'purple' }[user?.role] || 'blue';

  function handleLogout() { logout(); navigate('/'); }

  return (
    <aside className={s.sidebar}>
      <div className={s.logo}>
        <div className={s.logoText}>Fin<span>Ledger</span></div>
        <div className={s.logoSub}>FINANCE DASHBOARD</div>
      </div>

      <div className={s.userRow}>
        <div className={s.avatar}>{initials}</div>
        <div className={s.userInfo}>
          <div className={s.userName}>{user?.name}</div>
          <div className={`${s.roleChip} ${s[roleBadge]}`}>{user?.role}</div>
        </div>
      </div>

      <nav className={s.nav}>
        <div className={s.navSection}>Main</div>
        {NAV.filter(n => n.roles.includes(user?.role)).map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}
          >
            <span className={s.navIcon}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className={s.footer}>
        <button className={s.logout} onClick={handleLogout}>
          ⊗ &nbsp;Sign Out
        </button>
      </div>
    </aside>
  );
}
