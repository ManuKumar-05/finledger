// src/controllers/recordsController.js
//
// DATA ISOLATION STRATEGY
// ─────────────────────────────────────────────────────────
// is_demo = 1 users → see only records created by demo users
// is_demo = 0 users → see only records created by real users
//
// This gives demo users a fully populated sandbox while real
// users start with a clean, empty workspace.

const db = require('../config/database');

// ── Helpers ──────────────────────────────────────────────

/**
 * Returns a subquery that scopes records to the correct
 * user group (demo or real) based on the requesting user.
 */
function demoScope(isDemo) {
  return isDemo
    ? `r.created_by IN (SELECT id FROM users WHERE is_demo = 1)`
    : `r.created_by IN (SELECT id FROM users WHERE is_demo = 0)`;
}

function buildWhereClause(filters, isDemo) {
  const conditions = ['r.deleted = 0', demoScope(isDemo)];
  const params = [];

  if (filters.type)     { conditions.push('r.type = ?');     params.push(filters.type); }
  if (filters.category) { conditions.push('r.category = ?'); params.push(filters.category); }
  if (filters.from)     { conditions.push('r.date >= ?');    params.push(filters.from); }
  if (filters.to)       { conditions.push('r.date <= ?');    params.push(filters.to); }
  if (filters.search) {
    conditions.push('(r.description LIKE ? OR r.notes LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  return { where: conditions.join(' AND '), params };
}

// ── Controllers ──────────────────────────────────────────

/**
 * GET /api/records
 */
function getAll(req, res, next) {
  try {
    const { type, category, from, to, search } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const sort   = ['date','amount','description','created_at'].includes(req.query.sort) ? req.query.sort : 'date';
    const order  = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;
    const isDemo = req.user.is_demo === 1;

    const { where, params } = buildWhereClause({ type, category, from, to, search }, isDemo);

    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM records r WHERE ${where}`).get(...params).cnt;
    const rows  = db.prepare(`
      SELECT r.*, u.name AS created_by_name
      FROM records r LEFT JOIN users u ON r.created_by = u.id
      WHERE ${where}
      ORDER BY r.${sort} ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      success: true,
      data: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/records/:id
 */
function getOne(req, res, next) {
  try {
    const isDemo = req.user.is_demo === 1;
    const scope  = demoScope(isDemo);

    const row = db.prepare(`
      SELECT r.*, u.name AS created_by_name
      FROM records r LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ? AND r.deleted = 0 AND ${scope}
    `).get(req.params.id);

    if (!row) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

/**
 * POST /api/records  [Admin only]
 * Demo admins are blocked — their data is read-only sandbox.
 */
function create(req, res, next) {
  try {
    if (req.user.is_demo === 1) {
      return res.status(403).json({
        success: false,
        message: 'Demo accounts are read-only. Register a real account to create records.',
      });
    }

    const { description, amount, type, category, date, notes = '' } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO records (description, amount, type, category, date, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(description, amount, type, category, date, notes, req.user.id, now, now);

    const record = db.prepare('SELECT * FROM records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Record created.', data: record });
  } catch (err) { next(err); }
}

/**
 * PUT /api/records/:id  [Admin only]
 * Demo admins are blocked.
 */
function update(req, res, next) {
  try {
    if (req.user.is_demo === 1) {
      return res.status(403).json({
        success: false,
        message: 'Demo accounts are read-only. Register a real account to edit records.',
      });
    }

    const isDemo = req.user.is_demo === 1;
    const scope  = demoScope(isDemo);
    const record = db.prepare(`SELECT * FROM records r WHERE r.id = ? AND r.deleted = 0 AND ${scope}`).get(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

    const { description, amount, type, category, date, notes } = req.body;
    db.prepare(`
      UPDATE records
      SET description=?, amount=?, type=?, category=?, date=?, notes=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      description ?? record.description,
      amount      ?? record.amount,
      type        ?? record.type,
      category    ?? record.category,
      date        ?? record.date,
      notes       ?? record.notes,
      record.id
    );

    const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(record.id);
    res.json({ success: true, message: 'Record updated.', data: updated });
  } catch (err) { next(err); }
}

/**
 * DELETE /api/records/:id  [Admin only]
 * Demo admins are blocked.
 */
function remove(req, res, next) {
  try {
    if (req.user.is_demo === 1) {
      return res.status(403).json({
        success: false,
        message: 'Demo accounts are read-only. Register a real account to delete records.',
      });
    }

    const isDemo = req.user.is_demo === 1;
    const scope  = demoScope(isDemo);
    const record = db.prepare(`SELECT id FROM records r WHERE r.id = ? AND r.deleted = 0 AND ${scope}`).get(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

    db.prepare(`UPDATE records SET deleted = 1, updated_at = datetime('now') WHERE id = ?`).run(record.id);
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove };
