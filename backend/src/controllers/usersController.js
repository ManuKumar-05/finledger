// src/controllers/usersController.js
//
// DATA ISOLATION
// Demo admin → reads/manages only demo users (is_demo=1), all writes blocked
// Real admin → reads/manages only real users (is_demo=0)

const bcrypt = require('bcryptjs');
const db = require('../config/database');

// ── GET /api/users  ───────────────────────────────────────

function getAll(req, res, next) {
  try {
    const isDemo = req.user.is_demo === 1;
    const { role, status, search } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [`is_demo = ${isDemo ? 1 : 0}`];
    const params = [];

    if (role)   { conditions.push('role = ?');   params.push(role); }
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (search) {
      conditions.push('(name LIKE ? OR username LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = conditions.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM users WHERE ${where}`).get(...params).cnt;
    const rows  = db.prepare(`
      SELECT id, name, username, email, role, status, is_demo, created_at, updated_at
      FROM users WHERE ${where}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ success: true, data: rows, pagination: { total, page, limit, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
}

// ── GET /api/users/:id  ───────────────────────────────────

function getOne(req, res, next) {
  try {
    const isDemo = req.user.is_demo === 1;
    const user = db.prepare(
      'SELECT id, name, username, email, role, status, is_demo, created_at, updated_at FROM users WHERE id = ? AND is_demo = ?'
    ).get(req.params.id, isDemo ? 1 : 0);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

// ── POST /api/users  ─────────────────────────────────────

async function create(req, res, next) {
  try {
    // Demo admins cannot create users
    if (req.user.is_demo === 1) {
      return res.status(403).json({
        success: false,
        message: 'Demo accounts cannot create users. Register a real account to manage your team.',
      });
    }

    const { name, username, email, password, role = 'viewer', status = 'active' } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const now    = new Date().toISOString();

    // New users created by real admins are also real (is_demo=0)
    const result = db.prepare(`
      INSERT INTO users (name, username, email, password, role, status, is_demo, created_at, updated_at)
      VALUES (?,?,?,?,?,?,0,?,?)
    `).run(name, username, email, hashed, role, status, now, now);

    const user = db.prepare(
      'SELECT id, name, username, email, role, status, is_demo, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: 'User created.', data: user });
  } catch (err) { next(err); }
}

// ── PUT /api/users/:id  ───────────────────────────────────

async function update(req, res, next) {
  try {
    if (req.user.is_demo === 1) {
      return res.status(403).json({
        success: false,
        message: 'Demo accounts are read-only.',
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_demo = 0').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { name, username, email, role, status, password } = req.body;

    if (role && role !== 'admin' && user.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) AS cnt FROM users WHERE role='admin' AND status='active' AND is_demo=0").get().cnt;
      if (adminCount <= 1) return res.status(400).json({ success: false, message: 'Cannot remove the last active admin.' });
    }

    let hashedPw = user.password;
    if (password) hashedPw = await bcrypt.hash(password, 10);

    db.prepare(`
      UPDATE users SET name=?, username=?, email=?, role=?, status=?, password=?, updated_at=datetime('now') WHERE id=?
    `).run(
      name     ?? user.name,
      username ?? user.username,
      email    ?? user.email,
      role     ?? user.role,
      status   ?? user.status,
      hashedPw,
      user.id
    );

    const updated = db.prepare(
      'SELECT id, name, username, email, role, status, is_demo, created_at, updated_at FROM users WHERE id = ?'
    ).get(user.id);

    res.json({ success: true, message: 'User updated.', data: updated });
  } catch (err) { next(err); }
}

// ── DELETE /api/users/:id  ────────────────────────────────

function remove(req, res, next) {
  try {
    if (req.user.is_demo === 1) {
      return res.status(403).json({ success: false, message: 'Demo accounts are read-only.' });
    }

    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = db.prepare('SELECT id, role FROM users WHERE id = ? AND is_demo = 0').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) AS cnt FROM users WHERE role='admin' AND status='active' AND is_demo=0").get().cnt;
      if (adminCount <= 1) return res.status(400).json({ success: false, message: 'Cannot delete the last admin.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
}

// ── PATCH /api/users/:id/status  ─────────────────────────

function toggleStatus(req, res, next) {
  try {
    if (req.user.is_demo === 1) {
      return res.status(403).json({ success: false, message: 'Demo accounts are read-only.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_demo = 0').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    db.prepare(`UPDATE users SET status=?, updated_at=datetime('now') WHERE id=?`).run(newStatus, user.id);
    res.json({ success: true, message: `User is now ${newStatus}.`, data: { status: newStatus } });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove, toggleStatus };
