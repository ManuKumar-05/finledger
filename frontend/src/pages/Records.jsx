// src/pages/Records.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { recordsAPI } from '../utils/api';
import { formatCurrency, formatDate, capitalize, todayISO, CATEGORIES } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/layout/PageHeader';
import { Button, Modal, Field, Input, Select, Textarea, ConfirmModal, Spinner, Empty, Panel } from '../components/common/UI';
import s from './Records.module.css';

const EMPTY_FORM = { description:'', amount:'', type:'income', category:'salary', date: todayISO(), notes:'' };

export default function Records() {
  const { can, isDemo } = useAuth();
  const toast = useToast();

  const [records, setRecords]   = useState([]);
  const [pagination, setPag]    = useState({ total:0, page:1, pages:1 });
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ search:'', type:'', category:'', from:'', to:'', page:1, limit:10, sort:'date', order:'desc' });
  const [modalOpen, setModal]   = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [confirmId, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''));
      const res = await recordsAPI.getAll(params);
      setRecords(res.data.data);
      setPag(res.data.pagination);
    } catch { toast('Failed to load records', 'error'); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v, page: 1 })); }
  function clearFilters() { setFilters({ search:'', type:'', category:'', from:'', to:'', page:1, limit:10, sort:'date', order:'desc' }); }

  function openAdd() { setForm(EMPTY_FORM); setErrors({}); setEditId(null); setModal(true); }
  function openEdit(r) {
    if (isDemo) { toast('Demo accounts are read-only. Register to edit records.', 'info'); return; }
    setForm({ description:r.description, amount:r.amount, type:r.type, category:r.category, date:r.date, notes:r.notes||'' });
    setErrors({}); setEditId(r.id); setModal(true);
  }

  function validate() {
    const e = {};
    if (!form.description.trim()) e.description = 'Required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Must be > 0';
    if (!form.date) e.date = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (isDemo) { toast('Demo accounts are read-only.', 'info'); return; }
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editId) { await recordsAPI.update(editId, payload); toast('Record updated', 'success'); }
      else        { await recordsAPI.create(payload);         toast('Record created', 'success'); }
      setModal(false); load();
    } catch (err) { toast(err.response?.data?.message || 'Save failed', 'error'); }
    setSaving(false);
  }

  async function deleteRecord() {
    setDeleting(true);
    try {
      await recordsAPI.remove(confirmId);
      toast('Record deleted', 'info');
      setConfirm(null); load();
    } catch { toast('Delete failed', 'error'); }
    setDeleting(false);
  }

  return (
    <div className={s.page}>
      <PageHeader
        title="Financial Records"
        subtitle={`${pagination.total} total entries`}
        actions={
          isDemo
            ? <span style={{fontSize:'11px',color:'#f5c842',background:'rgba(245,200,66,0.1)',border:'1px solid rgba(245,200,66,0.25)',borderRadius:'7px',padding:'6px 14px'}}>
                Demo — read only
              </span>
            : can.create() && <Button onClick={openAdd}>+ Add Record</Button>
        }
      />
      <div className={s.content}>
        {/* Filter Bar */}
        <div className={s.filterBar}>
          <input className={s.search} placeholder="🔍 Search records…"
            value={filters.search} onChange={e => setFilter('search', e.target.value)} />
          <select className={s.filterSelect} value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className={s.filterSelect} value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
          </select>
          <input type="date" className={s.filterSelect} value={filters.from} onChange={e => setFilter('from', e.target.value)} />
          <input type="date" className={s.filterSelect} value={filters.to}   onChange={e => setFilter('to', e.target.value)} />
          <Button variant="secondary" onClick={clearFilters}>Clear</Button>
        </div>

        {/* Table */}
        <Panel>
          {loading ? (
            <div className={s.loadWrap}><Spinner size={30} /></div>
          ) : records.length === 0 ? (
            <Empty icon="🔍" title="No records found" desc="Try adjusting your filters" />
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th onClick={() => { setFilter('sort','description'); setFilters(f=>({...f,order:f.order==='asc'?'desc':'asc'})); }}>Description ↕</th>
                    <th onClick={() => { setFilter('sort','amount'); setFilters(f=>({...f,order:f.order==='asc'?'desc':'asc'})); }}>Amount ↕</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th onClick={() => { setFilter('sort','date'); setFilters(f=>({...f,order:f.order==='asc'?'desc':'asc'})); }}>Date ↕</th>
                    <th>Notes</th>
                    {can.edit() && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className={s.tdDesc}>{r.description}</td>
                      <td className={r.type==='income' ? s.pos : s.neg}>
                        {r.type==='income' ? '+' : '-'}{formatCurrency(r.amount)}
                      </td>
                      <td><span className={`${s.pill} ${r.type==='income' ? s.pillIncome : s.pillExpense}`}>{r.type}</span></td>
                      <td><span className={s.cat}>{capitalize(r.category)}</span></td>
                      <td className={s.tdDate}>{formatDate(r.date)}</td>
                      <td className={s.tdNote}>{r.notes || '—'}</td>
                      {can.edit() && (
                        <td>
                          <div className={s.actions}>
                            <button className={s.iconBtn} onClick={() => openEdit(r)} title="Edit">✏️</button>
                            <button className={`${s.iconBtn} ${s.del}`} onClick={() => setConfirm(r.id)} title="Delete">🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={s.pagination}>
              <span className={s.pageInfo}>
                {(pagination.page-1)*filters.limit+1}–{Math.min(pagination.page*filters.limit, pagination.total)} of {pagination.total}
              </span>
              <button className={s.pageBtn} disabled={pagination.page<=1} onClick={() => setFilter('page', pagination.page-1)}>‹</button>
              {Array.from({length: pagination.pages}, (_,i)=>i+1).map(p=>(
                <button key={p} className={`${s.pageBtn} ${p===pagination.page ? s.active:''}`} onClick={() => setFilter('page', p)}>{p}</button>
              ))}
              <button className={s.pageBtn} disabled={pagination.page>=pagination.pages} onClick={() => setFilter('page', pagination.page+1)}>›</button>
            </div>
          )}
        </Panel>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModal(false)}
        title={editId ? 'Edit Record' : 'Add Record'}
        footer={<><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={save} loading={saving}>Save Record</Button></>}
      >
        <Field label="Description *" error={errors.description}>
          <Input placeholder="e.g. Monthly Salary" value={form.description}
            onChange={e => setForm(f=>({...f,description:e.target.value}))} />
        </Field>
        <div className={s.formRow}>
          <Field label="Amount *" error={errors.amount}>
            <Input type="number" min="0.01" step="0.01" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
          </Field>
          <Field label="Type *">
            <Select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </Field>
        </div>
        <div className={s.formRow}>
          <Field label="Category *">
            <Select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
            </Select>
          </Field>
          <Field label="Date *" error={errors.date}>
            <Input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea placeholder="Optional notes…" value={form.notes}
            onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
        </Field>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal open={!!confirmId} onClose={() => setConfirm(null)} onConfirm={deleteRecord}
        title="Delete Record" danger
        message="Are you sure you want to delete this record? This action cannot be undone." />
    </div>
  );
}
