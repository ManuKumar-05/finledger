// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';
import Welcome   from './pages/Welcome';
import Register  from './pages/Register';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records   from './pages/Records';
import Analytics from './pages/Analytics';
import Users     from './pages/Users';
import { Spinner } from './components/common/UI';

/* Protected route — redirects to /login if not authenticated */
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <Spinner size={40} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

/* Public route — redirects to /dashboard if already authenticated */
function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public welcome screen at root */}
      <Route path="/"       element={<Public><Welcome /></Public>} />
      <Route path="/login"    element={<Public><Login /></Public>} />
      <Route path="/register" element={<Public><Register /></Public>} />

      {/* Protected app routes */}
      <Route path="/app" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="records"   element={<Records />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users"     element={<Users />} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/records"   element={<Navigate to="/app/records"   replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/users"     element={<Navigate to="/app/users"     replace />} />
      <Route path="*"          element={<Navigate to="/"              replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
