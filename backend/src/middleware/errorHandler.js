// src/middleware/errorHandler.js

const { validationResult } = require('express-validator');

/**
 * validate — runs express-validator checks and returns 422 if any fail.
 * Call as middleware AFTER your validation rules array.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * notFound — 404 handler for unmatched routes.
 */
function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
}

/**
 * globalError — catch-all error handler.
 */
function globalError(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[ERROR]', err.message, err.stack);

  // SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
}

module.exports = { validate, notFound, globalError };
