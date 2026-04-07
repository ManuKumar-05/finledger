// src/utils/api.js
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fl_token');
      localStorage.removeItem('fl_user');
      window.location.href = '/login';    }
    return Promise.reject(err);
  }
);

export default api;

// ── Typed API calls ──────────────────────────────────────────

export const authAPI = {
  login:          (data)  => api.post('/auth/login', data),
  me:             ()      => api.get('/auth/me'),
  changePassword: (data)  => api.post('/auth/change-password', data),
};

export const recordsAPI = {
  getAll:  (params) => api.get('/records', { params }),
  getOne:  (id)     => api.get(`/records/${id}`),
  create:  (data)   => api.post('/records', data),
  update:  (id, d)  => api.put(`/records/${id}`, d),
  remove:  (id)     => api.delete(`/records/${id}`),
};

export const dashboardAPI = {
  summary:    ()       => api.get('/dashboard/summary'),
  monthly:    (months) => api.get('/dashboard/monthly', { params: { months } }),
  categories: (params) => api.get('/dashboard/categories', { params }),
  weekly:     ()       => api.get('/dashboard/weekly'),
  recent:     (limit)  => api.get('/dashboard/recent', { params: { limit } }),
  insights:   ()       => api.get('/dashboard/insights'),
};

export const usersAPI = {
  getAll:       (params) => api.get('/users', { params }),
  getOne:       (id)     => api.get(`/users/${id}`),
  create:       (data)   => api.post('/users', data),
  update:       (id, d)  => api.put(`/users/${id}`, d),
  remove:       (id)     => api.delete(`/users/${id}`),
  toggleStatus: (id)     => api.patch(`/users/${id}/status`),
};
