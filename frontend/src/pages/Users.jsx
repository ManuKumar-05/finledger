// src/pages/Users.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { usersAPI } from '../utils/api';
import { formatDate, capitalize } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/layout/PageHeader';
import { Button, Modal, Field, Input, Select, ConfirmModal, Spinner, Empty, Panel } from '../components/common/UI';
import s from './Users.module.css';

const EMPTY_FORM = { name:'', username:'', email:'', password:'', role:'viewer', status:'active' };
const ROLE_COLOR = { admin:'yellow', analyst:'blue', viewer:'purple' };

export default function Users() {
  const { can, user: me, isDemo } = useAuth();
  const toast = useToast();

  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState('');
  const [roleF,    setRoleF]   = useState('');
  const [modal,    setModal]   = useState(false);
  const [editId,   setEditId]  = useState(null);
  const [form,     setForm]    = useState(EMPTY_FORM);
  const [errors,   setErrors]  = useState({});
  const [saving,   setSaving]  = useState(false);
  const [confirmId,setConfirm] = useState(null);

  const load = useCallback(async () => {
    if (!can.manageUsers()) return;
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ search, role: roleF, limit: 50 });
      setUsers(res.data.data);
    } catch { toast('Failed to load users', 'error'); }
    setLoading(false);
  }, [search, roleF]);

  useEffect(() => { load(); }, [load]);

  if (!can.manageUsers()) return (
    <div className={s.page}>
      <PageHeader title="User Management" />
      <div className={s.denied}>
        <div className={s.deniedIcon}>🔒</div>
        <div className={s.deniedTitle}>Admin Only</div>
        <p className={s.deniedDesc}>User management is restricted to Administrators.</p>
      </div>
    </div>
  );

  function openAdd() { setForm(EMPTY_FORM); setErrors({}); setEditId(null); setModal(true); }
  function openEdit(u) {
    if (isDemo) { toast('Demo accounts are read-only. Register to manage users.', 'info'); return; }
    setForm({ name:u.name, username:u.username, email:u.email, password:'', role:u.role, status:u.status });
    setErrors({}); setEditId(u.id); setModal(true);
  }

  function validate() {
    const e = {};
    if (!form.name.trim())     e.name = 'Required';
    if (!form.username.trim()) e.username = 'Required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (!editId && form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (editId && !payload.password) delete payload.password;
      if (editId) { await usersAPI.update(editId, payload); toast('User updated', 'success'); }
      else        { await usersAPI.create(payload);         toast('User created', 'success'); }
      setModal(false); load();
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    }
    setSaving(false);
  }

  async function deleteUser() {
    try {
      await usersAPI.remove(confirmId);
      toast('User deleted', 'info');
      setConfirm(null); load();
    } catch (err) { toast(err.response?.data?.message || 'Delete failed', 'error'); }
  }

  async function toggleStatus(u) {
    try {
      const res = await usersAPI.toggleStatus(u.id);
      toast(`${u.name} is now ${res.data.data.status}`, 'info');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Failed', 'error'); }
  }

  const avatarColor = { admin:'var(--yellow)', analyst:'var(--blue)', viewer:'var(--purple)' };
  const avatarBg    = { admin:'var(--yellow-dim)', analyst:'var(--blue-dim)', viewer:'var(--purple-dim)' };

  return (
    <div className={s.page}>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users`}
        actions={
          isDemo
            ? <span style={{fontSize:'11px',color:'#f5c842',background:'rgba(245,200,66,0.1)',border:'1px solid rgba(245,200,66,0.25)',borderRadius:'7px',padding:'6px 14px'}}>
                Demo — read only
              </span>
            : <Button onClick={openAdd}>+ Add User</Button>
        }
      />
      <div className={s.content}>
        {/* Filters */}
        <div className={s.filterBar}>
          <input className={s.search} placeholder="🔍 Search users…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className={s.filterSelect} value={roleF} onChange={e => setRoleF(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {loading ? (
          <div className={s.center}><Spinner size={30} /></div>
        ) : users.length === 0 ? (
          <Empty icon="👤" title="No users found" />
        ) : (
          <div className={s.grid}>
            {users.map(u => (
              <div key={u.id} className={s.card}>
                <div className={s.cardTop}>
                  <div className={s.avatar} style={{ background: avatarBg[u.role], color: avatarColor[u.role] }}>
                    {u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className={s.userInfo}>
                    <div className={s.userName}>{u.name}</div>
                    <div className={s.userEmail}>{u.email}</div>
                  </div>
                </div>
                <div className={s.details}>
                  <div className={s.detRow}>
                    <span className={s.detLabel}>Username</span>
                    <span className={s.detVal}>{u.username}</span>
                  </div>
                  <div className={s.detRow}>
                    <span className={s.detLabel}>Role</span>
                    <span className={`${s.roleBadge} ${s[ROLE_COLOR[u.role]]}`}>{u.role}</span>
                  </div>
                  <div className={s.detRow}>
                    <span className={s.detLabel}>Status</span>
                    <span className={`${s.statusBadge} ${u.status === 'active' ? s.active : s.inactive}`}>{u.status}</span>
                  </div>
                  <div className={s.detRow}>
                    <span className={s.detLabel}>Joined</span>
                    <span className={s.detVal}>{formatDate(u.created_at?.slice(0,10) || u.created_at)}</span>
                  </div>
                </div>
                <div className={s.cardActions}>
                  <button className={s.actBtn} onClick={() => openEdit(u)}>✏️ Edit</button>
                  <button className={s.actBtn} onClick={() => toggleStatus(u)}>
                    {u.status === 'active' ? '⊘ Deactivate' : '✓ Activate'}
                  </button>
                  {u.id !== me.id && (
                    <button className={`${s.actBtn} ${s.delBtn}`} onClick={() => setConfirm(u.id)}>🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editId ? 'Edit User' : 'Add User'}
        footer={<><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save User</Button></>}
      >
        <div className={s.formRow}>
          <Field label="Full Name *" error={errors.name}>
            <Input placeholder="Full name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </Field>
          <Field label="Username *" error={errors.username}>
            <Input placeholder="username" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} />
          </Field>
        </div>
        <div className={s.formRow}>
          <Field label="Email *" error={errors.email}>
            <Input type="email" placeholder="user@example.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
          </Field>
          <Field label={editId ? 'New Password (leave blank to keep)' : 'Password *'} error={errors.password}>
            <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
          </Field>
        </div>
        <div className={s.formRow}>
          <Field label="Role">
            <Select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmModal open={!!confirmId} onClose={() => setConfirm(null)} onConfirm={deleteUser}
        title="Delete User" danger message="Are you sure? The user will permanently lose access." />
    </div>
  );
}
