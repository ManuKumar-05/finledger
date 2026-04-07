// src/pages/Analytics.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { dashboardAPI } from '../utils/api';
import { formatCurrency, capitalize } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/layout/PageHeader';
import { Panel, PanelHeader, Spinner, Empty } from '../components/common/UI';
import s from './Analytics.module.css';

export default function Analytics() {
  const { can } = useAuth();
  const [insights, setInsights] = useState(null);
  const [monthly,  setMonthly]  = useState([]);
  const [weekly,   setWeekly]   = useState([]);
  const [incCats,  setIncCats]  = useState([]);
  const [expCats,  setExpCats]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    if (!can.viewAnalytics()) return;
    setLoading(true);
    try {
      const [ins, mon, wk, ic, ec] = await Promise.all([
        dashboardAPI.insights(),
        dashboardAPI.monthly(6),
        dashboardAPI.weekly(),
        dashboardAPI.categories({ type:'income' }),
        dashboardAPI.categories({ type:'expense' }),
      ]);
      setInsights(ins.data.data);
      setMonthly(mon.data.data);
      setWeekly(wk.data.data);
      setIncCats(ic.data.data);
      setExpCats(ec.data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!can.viewAnalytics()) return (
    <div className={s.page}>
      <PageHeader title="Analytics" />
      <div className={s.denied}>
        <div className={s.deniedIcon}>🔒</div>
        <div className={s.deniedTitle}>Access Restricted</div>
        <p className={s.deniedDesc}>Analytics is available for Analysts and Admins only.</p>
      </div>
    </div>
  );

  if (loading) return <div className={s.page}><div className={s.center}><Spinner size={36}/></div></div>;

  const maxWeekly  = Math.max(...weekly.map(w => Math.max(w.income, w.expense)), 1);
  const maxMonthly = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);
  const maxInc = Math.max(...incCats.map(c=>c.total), 1);
  const maxExp = Math.max(...expCats.map(c=>c.total), 1);

  const kpis = [
    { label:'Savings Rate',        val: `${insights?.savings_rate ?? 0}%`,     icon:'💡', color:'accent' },
    { label:'Avg Transaction',     val: formatCurrency(insights?.avg_transaction), icon:'📊', color:'blue'   },
    { label:'Top Expense Category',val: capitalize(insights?.top_expense_category || 'N/A'), icon:'🏷️', color:'yellow'  },
    { label:'Records This Month',  val: insights?.records_this_month ?? 0,      icon:'📅', color:'purple' },
  ];

  return (
    <div className={s.page}>
      <PageHeader title="Analytics" subtitle="Deep insights into your financial data" />
      <div className={s.content}>

        {/* KPI Cards */}
        <div className={s.kpiGrid}>
          {kpis.map((k,i) => (
            <div key={i} className={`${s.kpiCard} ${s[k.color]} fade-up`} style={{animationDelay:i*0.07+'s'}}>
              <div className={s.kpiIcon}>{k.icon}</div>
              <div>
                <div className={s.kpiLabel}>{k.label}</div>
                <div className={s.kpiVal}>{k.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        <Panel style={{marginBottom:20}}>
          <PanelHeader title="Monthly Income vs Expense">
            <div className={s.legend}>
              <span className={s.dot} style={{background:'var(--accent)'}}/>Income
              <span className={s.dot} style={{background:'var(--red)'}}/>Expense
            </div>
          </PanelHeader>
          <div className={s.chartWrap}>
            <div className={s.barChart}>
              {monthly.map((m,i) => (
                <div key={i} className={s.barGroup}>
                  <div className={s.barWrap}>
                    <div title={formatCurrency(m.income)}  className={`${s.bar} ${s.inc}`} style={{height:Math.max(4,(m.income/maxMonthly)*180)}}/>
                    <div title={formatCurrency(m.expense)} className={`${s.bar} ${s.exp}`} style={{height:Math.max(4,(m.expense/maxMonthly)*180)}}/>
                  </div>
                  <div className={s.barLabel}>{m.month?.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className={s.grid2}>
          {/* Weekly */}
          <Panel>
            <PanelHeader title="Weekly Summary (Last 4 Weeks)" />
            <div className={s.chartWrap}>
              <div className={s.barChart}>
                {weekly.map((w,i)=>(
                  <div key={i} className={s.barGroup}>
                    <div className={s.barWrap}>
                      <div title={formatCurrency(w.income)}  className={`${s.bar} ${s.inc}`} style={{height:Math.max(4,(w.income/maxWeekly)*160)}}/>
                      <div title={formatCurrency(w.expense)} className={`${s.bar} ${s.exp}`} style={{height:Math.max(4,(w.expense/maxWeekly)*160)}}/>
                    </div>
                    <div className={s.barLabel}>{w.week}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Savings summary */}
          <Panel>
            <PanelHeader title="Financial Summary" />
            <div className={s.summaryList}>
              {[
                {l:'Total Income',  v:formatCurrency(insights?.total_income),  c:'var(--accent)'},
                {l:'Total Expense', v:formatCurrency(insights?.total_expense), c:'var(--red)'},
                {l:'Net Balance',   v:formatCurrency(insights?.net_balance),   c:'var(--blue)'},
                {l:'Total Records', v:insights?.total_records,                 c:'var(--purple)'},
                {l:'Savings Rate',  v:`${insights?.savings_rate}%`,            c:'var(--accent)'},
              ].map((row,i)=>(
                <div key={i} className={s.sumRow}>
                  <span className={s.sumLabel}>{row.l}</span>
                  <span className={s.sumVal} style={{color:row.c}}>{row.v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className={s.grid2}>
          {/* Income by category */}
          <Panel>
            <PanelHeader title="Income by Category" />
            <div className={s.catBody}>
              {incCats.length===0 ? <Empty icon="📊" title="No data"/> :
                incCats.map((c,i)=>(
                  <div key={i} className={s.catRow}>
                    <div className={s.catInfo}><span>{capitalize(c.category)}</span><span style={{color:'var(--accent)'}}>{formatCurrency(c.total)}</span></div>
                    <div className={s.track}><div className={s.fill} style={{width:`${(c.total/maxInc)*100}%`,background:'var(--accent)'}}/></div>
                  </div>
                ))}
            </div>
          </Panel>

          {/* Expense by category */}
          <Panel>
            <PanelHeader title="Expenses by Category" />
            <div className={s.catBody}>
              {expCats.length===0 ? <Empty icon="📊" title="No data"/> :
                expCats.map((c,i)=>(
                  <div key={i} className={s.catRow}>
                    <div className={s.catInfo}><span>{capitalize(c.category)}</span><span style={{color:'var(--red)'}}>{formatCurrency(c.total)}</span></div>
                    <div className={s.track}><div className={s.fill} style={{width:`${(c.total/maxExp)*100}%`,background:'var(--red)'}}/></div>
                  </div>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
