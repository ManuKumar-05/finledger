// src/components/common/UI.jsx
// Reusable UI primitives

import React from 'react';
import s from './UI.module.css';

/* ── Spinner ── */
export function Spinner({ size = 20 }) {
  return <div className={s.spinner} style={{ width: size, height: size }} />;
}

/* ── Button ── */
export function Button({ children, variant = 'primary', size = 'md', loading, disabled, className = '', ...props }) {
  return (
    <button
      className={`${s.btn} ${s[variant]} ${s[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}

/* ── Badge ── */
export function Badge({ children, color = 'accent' }) {
  return <span className={`${s.badge} ${s['badge-' + color]}`}>{children}</span>;
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, footer, width = 480 }) {
  if (!open) return null;
  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ width }}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>{title}</div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={s.modalBody}>{children}</div>
        {footer && <div className={s.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

/* ── Form Field ── */
export function Field({ label, error, children }) {
  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}</label>}
      {children}
      {error && <div className={s.fieldError}>{error}</div>}
    </div>
  );
}

export function Input(props) {
  return <input className={s.input} {...props} />;
}

export function Select({ children, ...props }) {
  return <select className={s.input} {...props}>{children}</select>;
}

export function Textarea(props) {
  return <textarea className={s.input} rows={2} {...props} />;
}

/* ── Panel ── */
export function Panel({ children, className = '' }) {
  return <div className={`${s.panel} ${className}`}>{children}</div>;
}
export function PanelHeader({ title, children }) {
  return (
    <div className={s.panelHeader}>
      <div className={s.panelTitle}>{title}</div>
      {children}
    </div>
  );
}

/* ── Empty State ── */
export function Empty({ icon = '📭', title, desc }) {
  return (
    <div className={s.empty}>
      <div className={s.emptyIcon}>{icon}</div>
      <div className={s.emptyTitle}>{title}</div>
      {desc && <div className={s.emptyDesc}>{desc}</div>}
    </div>
  );
}

/* ── Confirm Modal ── */
export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirm', message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={380}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
        </>
      }
    >
      <p style={{ color: 'var(--text2)', fontSize: 13 }}>{message}</p>
    </Modal>
  );
}
