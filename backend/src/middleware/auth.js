// src/middleware/auth.js
// JWT verification + role-based authorization guards

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * authenticate — verifies JWT from Authorization header.
 * Attaches req.user on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_secret_32chars_min');
    // Fetch fresh user from DB (catches deactivated accounts)
    const user = db.prepare('SELECT id, name, username, email, role, status, is_demo FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is inactive. Contact your administrator.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

/**
 * authorize(...roles) — role gate middleware factory.
 * Usage: router.post('/', authenticate, authorize('admin'), handler)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}

// Convenience guards
const adminOnly    = authorize('admin');
const analystPlus  = authorize('admin', 'analyst');
const anyRole      = authorize('admin', 'analyst', 'viewer');

module.exports = { authenticate, authorize, adminOnly, analystPlus, anyRole };
