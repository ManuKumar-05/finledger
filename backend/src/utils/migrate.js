// src/utils/migrate.js
// Runs all DDL statements to create tables and apply schema migrations

const db = require('../config/database');

function migrate() {
  console.log('🔧  Running migrations...');

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL CHECK (role IN ('admin','analyst','viewer')) DEFAULT 'viewer',
      status      TEXT    NOT NULL CHECK (status IN ('active','inactive'))      DEFAULT 'active',
      is_demo     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT    NOT NULL,
      amount      REAL    NOT NULL CHECK (amount > 0),
      type        TEXT    NOT NULL CHECK (type IN ('income','expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      notes       TEXT    DEFAULT '',
      deleted     INTEGER NOT NULL DEFAULT 0,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_records_type       ON records(type)       WHERE deleted = 0;
    CREATE INDEX IF NOT EXISTS idx_records_category   ON records(category)   WHERE deleted = 0;
    CREATE INDEX IF NOT EXISTS idx_records_date       ON records(date)       WHERE deleted = 0;
    CREATE INDEX IF NOT EXISTS idx_records_deleted    ON records(deleted);
    CREATE INDEX IF NOT EXISTS idx_records_created_by ON records(created_by) WHERE deleted = 0;
    CREATE INDEX IF NOT EXISTS idx_users_username     ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_demo      ON users(is_demo);
  `);

  // Live migration: add is_demo column if upgrading from older schema
  const cols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
  if (!cols.includes('is_demo')) {
    db.exec('ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0');
    console.log('  ✓ Applied migration: users.is_demo column added');
  }

  console.log('✅  Migrations complete.');
}

migrate();
module.exports = migrate;
