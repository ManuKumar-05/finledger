// src/controllers/dashboardController.js
//
// DATA ISOLATION
// Demo users (is_demo=1) → all queries scoped to records created by demo users
// Real users (is_demo=0) → all queries scoped to records created by real users

const db = require('../config/database');

// Returns a SQL fragment that scopes records to the right group
function demoScope(isDemo) {
  return isDemo
    ? `created_by IN (SELECT id FROM users WHERE is_demo = 1)`
    : `created_by IN (SELECT id FROM users WHERE is_demo = 0)`;
}

// ── Summary ──────────────────────────────────────────────

function summary(req, res, next) {
  try {
    const scope = demoScope(req.user.is_demo === 1);
    const row = db.prepare(`
      SELECT
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense,
        SUM(CASE WHEN type='income'  THEN amount ELSE -amount END) AS net_balance,
        COUNT(*) AS total_records,
        SUM(CASE WHEN type='income'  THEN 1 ELSE 0 END) AS income_count,
        SUM(CASE WHEN type='expense' THEN 1 ELSE 0 END) AS expense_count
      FROM records
      WHERE deleted = 0 AND ${scope}
    `).get();

    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// ── Monthly trend ─────────────────────────────────────────

function monthly(req, res, next) {
  try {
    const months = Math.min(24, Math.max(1, parseInt(req.query.months) || 6));
    const scope  = demoScope(req.user.is_demo === 1);

    const keys = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const rows = db.prepare(`
      SELECT
        strftime('%Y-%m', date) AS month,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
      FROM records
      WHERE deleted = 0 AND ${scope} AND strftime('%Y-%m', date) >= ?
      GROUP BY month
      ORDER BY month
    `).all(keys[0]);

    const rowMap = Object.fromEntries(rows.map(r => [r.month, r]));
    const data   = keys.map(k => rowMap[k] || { month: k, income: 0, expense: 0 });

    res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── Category breakdown ────────────────────────────────────

function categories(req, res, next) {
  try {
    const { type, months } = req.query;
    const scope = demoScope(req.user.is_demo === 1);
    const conditions = [`deleted = 0`, scope];
    const params = [];

    if (type && ['income','expense'].includes(type)) {
      conditions.push('type = ?'); params.push(type);
    }
    if (months) {
      const d = new Date();
      d.setMonth(d.getMonth() - parseInt(months));
      conditions.push('date >= ?'); params.push(d.toISOString().split('T')[0]);
    }

    const rows = db.prepare(`
      SELECT category, type, SUM(amount) AS total, COUNT(*) AS count
      FROM records
      WHERE ${conditions.join(' AND ')}
      GROUP BY category, type
      ORDER BY total DESC
    `).all(...params);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── Weekly ────────────────────────────────────────────────

function weekly(req, res, next) {
  try {
    const scope = demoScope(req.user.is_demo === 1);
    const weeks = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const to   = new Date(now); to.setDate(to.getDate() - i * 7);
      const from = new Date(to);  from.setDate(from.getDate() - 6);
      const toStr   = to.toISOString().split('T')[0];
      const fromStr = from.toISOString().split('T')[0];

      const row = db.prepare(`
        SELECT
          SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
        FROM records
        WHERE deleted = 0 AND ${scope} AND date >= ? AND date <= ?
      `).get(fromStr, toStr);

      weeks.push({ week: `W${4-i}`, from: fromStr, to: toStr, income: row.income || 0, expense: row.expense || 0 });
    }

    res.json({ success: true, data: weeks });
  } catch (err) { next(err); }
}

// ── Recent ────────────────────────────────────────────────

function recent(req, res, next) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const scope = demoScope(req.user.is_demo === 1);

    const rows = db.prepare(`
      SELECT r.*, u.name AS created_by_name
      FROM records r LEFT JOIN users u ON r.created_by = u.id
      WHERE r.deleted = 0 AND ${scope}
      ORDER BY r.date DESC, r.created_at DESC
      LIMIT ?
    `).all(limit);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// ── Insights ─────────────────────────────────────────────

function insights(req, res, next) {
  try {
    const scope = demoScope(req.user.is_demo === 1);

    const all = db.prepare(`
      SELECT
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense,
        COUNT(*) AS total_records,
        AVG(amount) AS avg_amount
      FROM records WHERE deleted = 0 AND ${scope}
    `).get();

    const topCat = db.prepare(`
      SELECT category, SUM(amount) AS total
      FROM records WHERE deleted = 0 AND type='expense' AND ${scope}
      GROUP BY category ORDER BY total DESC LIMIT 1
    `).get();

    const curMonth = new Date().toISOString().slice(0, 7);
    const thisMonth = db.prepare(`
      SELECT COUNT(*) AS count FROM records
      WHERE deleted = 0 AND ${scope} AND strftime('%Y-%m', date) = ?
    `).get(curMonth);

    const savingsRate = all.total_income > 0
      ? ((all.total_income - all.total_expense) / all.total_income * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      data: {
        savings_rate:          parseFloat(savingsRate),
        avg_transaction:       Math.round(all.avg_amount || 0),
        top_expense_category:  topCat?.category || 'N/A',
        records_this_month:    thisMonth.count,
        total_income:          all.total_income  || 0,
        total_expense:         all.total_expense || 0,
        net_balance:           (all.total_income || 0) - (all.total_expense || 0),
        total_records:         all.total_records || 0,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { summary, monthly, categories, weekly, recent, insights };
