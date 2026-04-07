// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { dashboardAPI } from '../utils/api';
import { formatCurrency, formatDate, CAT_EMOJI, capitalize } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import { Panel, PanelHeader, Spinner, Empty } from '../components/common/UI';
import FreshStart from '../components/common/FreshStart';
import s from './Dashboard.module.css';

export default function Dashboard() {
  const { user, isDemo } = useAuth();
  const [summary,     setSummary]     = useState(null);
  const [monthly,     setMonthly]     = useState([]);
  const [cats,        setCats]        = useState([]);
  const [recent,      setRecent]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showFresh,   setShowFresh]   = useState(false);

  const isRealAdmin = user?.role === 'admin' && !isDemo;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, c, r] = await Promise.all([
        dashboardAPI.summary(),
        dashboardAPI.monthly(6),
        dashboardAPI.categories({ type: 'expense' }),
        dashboardAPI.recent(8),
      ]);
      setSummary(s.data.data);
      setMonthly(m.data.data);
      setCats(c.data.data);
      setRecent(r.data.data);
      // Show fresh start if real admin with zero records
      if (isRealAdmin && s.data.data.total_records === 0) {
        setShowFresh(true);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className={s.center}><Spinner size={36} /></div>;

  // New real admin with zero data — show onboarding
  if (showFresh) {
    return (
      <div className={s.page}>
        <PageHeader title="Dashboard" subtitle={`Welcome, ${user?.name?.split(' ')[0]}!`} />
        <FreshStart onDismiss={() => { setShowFresh(false); load(); }} />
      </div>
    );
  }

  const maxMonthly = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);
  const maxCat = Math.max(...cats.map(c => c.total), 1);
  const catColors = ['#00e5b4','#ff4d6a','#4d9fff','#f5c842','#a78bfa','#ff9500','#30d158'];

  const stats = [
    { label:'Total Income',    val: formatCurrency(summary?.total_income  || 0), sub: `${summary?.income_count || 0} transactions`,  cls: s.income  },
    { label:'Total Expenses',  val: formatCurrency(summary?.total_expense || 0), sub: `${summary?.expense_count || 0} transactions`, cls: s.expense },
    { label:'Net Balance',     val: formatCurrency(summary?.net_balance   || 0), sub: summary?.net_balance >= 0 ? 'Positive ↑' : 'Negative ↓', cls: s.balance },
    { label:'Total Records',   val: summary?.total_records || 0,                 sub: 'Financial entries',                          cls: s.count   },
  ];

  return (
    <div className={s.page}>
      <PageHeader title="Dashboard" subtitle="Financial overview at a glance" />
      <div className={s.content}>

        {/* Stat cards */}
        <div className={s.statsGrid}>
          {stats.map((st, i) => (
            <div key={i} className={`${s.statCard} ${st.cls} fade-up`} style={{ animationDelay: i * 0.07 + 's' }}>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statVal}>{st.val}</div>
              <div className={s.statSub}>{st.sub}</div>
            </div>
          ))}
        </div>

        <div className={s.grid2}>
          {/* Monthly Bar Chart */}
          <Panel>
            <PanelHeader title="Monthly Trend">
              <div className={s.legend}>
                <span className={s.dot} style={{background:'var(--accent)'}} />Income
                <span className={s.dot} style={{background:'var(--red)'}} />Expense
              </div>
            </PanelHeader>
            <div className={s.panelBody}>
              <div className={s.barChart}>
                {monthly.map((m, i) => (
                  <div key={i} className={s.barGroup}>
                    <div className={s.barWrap}>
                      <div title={formatCurrency(m.income)} className={`${s.bar} ${s.barIncome}`}
                        style={{ height: Math.max(4, (m.income / maxMonthly) * 160) }} />
                      <div title={formatCurrency(m.expense)} className={`${s.bar} ${s.barExpense}`}
                        style={{ height: Math.max(4, (m.expense / maxMonthly) * 160) }} />
                    </div>
                    <div className={s.barLabel}>{m.month?.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Category Breakdown */}
          <Panel>
            <PanelHeader title="Expense Categories" />
            <div className={s.panelBody}>
              {cats.length === 0 ? <Empty icon="📊" title="No data yet" /> :
                cats.slice(0, 7).map((c, i) => (
                  <div key={i} className={s.catRow}>
                    <div className={s.catInfo}>
                      <span className={s.catName}>{capitalize(c.category)}</span>
                      <span className={s.catAmt}>{formatCurrency(c.total)}</span>
                    </div>
                    <div className={s.catTrack}>
                      <div className={s.catFill} style={{ width: `${(c.total/maxCat)*100}%`, background: catColors[i % 7] }} />
                    </div>
                  </div>
                ))
              }
            </div>
          </Panel>
        </div>

        {/* Recent Activity */}
        <Panel>
          <PanelHeader title="Recent Activity">
            <a href="/app/records" className={s.viewAll}>View All →</a>
          </PanelHeader>
          <div className={s.panelBody}>
            {recent.length === 0
              ? <Empty icon="📋" title="No records yet" />
              : recent.map((r, i) => (
                <div key={i} className={s.actRow}>
                  <div className={s.actDot} style={{ background: r.type==='income' ? 'var(--accent-dim)' : 'var(--red-dim)' }}>
                    {CAT_EMOJI[r.category] || '💰'}
                  </div>
                  <div className={s.actInfo}>
                    <div className={s.actDesc}>{r.description}</div>
                    <div className={s.actMeta}>{capitalize(r.category)} · {formatDate(r.date)}</div>
                  </div>
                  <div className={s.actAmt} style={{ color: r.type==='income' ? 'var(--accent)' : 'var(--red)' }}>
                    {r.type==='income' ? '+' : '-'}{formatCurrency(r.amount)}
                  </div>
                </div>
              ))
            }
          </div>
        </Panel>
      </div>
    </div>
  );
}
