// src/utils/format.js

export function formatCurrency(amount) {
  if (amount == null) return '₹0';
  const n = Number(amount);
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)     return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export const CAT_EMOJI = {
  salary: '💼', freelance: '💻', investment: '📈',
  food: '🍽️', transport: '🚗', utilities: '⚡',
  entertainment: '🎬', healthcare: '💊', shopping: '🛍️', other: '📦',
};

export const CATEGORIES = [
  'salary','freelance','investment','food','transport',
  'utilities','entertainment','healthcare','shopping','other',
];
