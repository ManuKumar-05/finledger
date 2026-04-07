// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('fl_token');
    const saved  = localStorage.getItem('fl_user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch {}
      authAPI.me()
        .then(r => { setUser(r.data.data); localStorage.setItem('fl_user', JSON.stringify(r.data.data)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    const res = await authAPI.login({ username, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('fl_token', token);
    localStorage.setItem('fl_user', JSON.stringify(u));
    setUser(u);
    return u;
  }

  function logout() {
    localStorage.removeItem('fl_token');
    localStorage.removeItem('fl_user');
    setUser(null);
  }

  // Permission helpers
  // Demo users have is_demo=1 — they can VIEW but never WRITE
  const isDemo = user?.is_demo === 1;

  const can = {
    create:       () => user?.role === 'admin'  && !isDemo,
    edit:         () => user?.role === 'admin'  && !isDemo,
    delete:       () => user?.role === 'admin'  && !isDemo,
    manageUsers:  () => user?.role === 'admin'  && !isDemo,
    viewAnalytics:() => ['admin','analyst'].includes(user?.role),
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
