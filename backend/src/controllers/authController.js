// src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_32chars_min!!';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is inactive.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    const { password: _pw, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      data: { token, user: safeUser },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/auth/me
 * Returns authenticated user's profile.
 */
function me(req, res) {
  const { password: _pw, ...safeUser } = req.user;
  res.json({ success: true, data: req.user });
}

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const fullUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    const match = await bcrypt.compare(currentPassword, fullUser.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hashed, req.user.id);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
}



/**
 * POST /api/auth/register
 * Public — only allowed when NO real admin exists yet (first-time setup).
 * Creates the very first admin account for a new organisation.
 */
async function register(req, res, next) {
  try {
    const DEMO_USERNAMES = ['admin','analyst','viewer','david','eva'];
    const realAdmin = db.prepare(
      `SELECT id FROM users WHERE role = 'admin' AND username NOT IN (${DEMO_USERNAMES.map(()=>'?').join(',')}) LIMIT 1`
    ).get(...DEMO_USERNAMES);

    if (realAdmin) {
      return res.status(409).json({
        success: false,
        message: 'An admin account already exists. Please use the login page or ask your admin to create an account for you.',
      });
    }

    const { name, username, email, password } = req.body;

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ? COLLATE NOCASE').get(username, email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Username or email is already taken.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO users (name, username, email, password, role, status, is_demo, created_at, updated_at) VALUES (?,?,?,?,?,?,0,?,?)'
    ).run(name, username, email, hashed, 'admin', 'active', now, now);

    const user = db.prepare('SELECT id, name, username, email, role, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({
      success: true,
      message: 'Admin account created. Welcome to FinLedger!',
      data: { token, user },
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/auth/setup-status
 * Public — returns whether a real admin has registered yet.
 * Frontend uses this to decide whether to show Register or Login flow.
 */
function setupStatus(req, res, next) {
  try {
    const DEMO_USERNAMES = ['admin','analyst','viewer','david','eva'];
    const realAdmin = db.prepare(
      `SELECT id FROM users WHERE role = 'admin' AND username NOT IN (${DEMO_USERNAMES.map(()=>'?').join(',')}) LIMIT 1`
    ).get(...DEMO_USERNAMES);

    res.json({
      success: true,
      data: {
        setupComplete: !!realAdmin,
        message: realAdmin
          ? 'System is set up. Please log in.'
          : 'No admin registered yet. Please sign up to get started.',
      },
    });
  } catch (err) { next(err); }
}

// Re-export everything
module.exports = { login, me, changePassword, register, setupStatus };
