// src/components/layout/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DemoBanner from '../common/DemoBanner';
import s from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={s.layout}>
      <Sidebar />
      <main className={s.main}>
        <DemoBanner />
        <Outlet />
      </main>
    </div>
  );
}
