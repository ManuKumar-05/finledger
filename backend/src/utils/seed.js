// src/utils/seed.js
// Seeds demo users (is_demo=1) and their demo financial records.
// Real users registered via /api/auth/register have is_demo=0
// and see a completely empty, isolated workspace.

const bcrypt = require('bcryptjs');
const db = require('../config/database');
const migrate = require('./migrate');

async function seed() {
  migrate();
  console.log('🌱  Seeding demo data...');

  // Clear existing data
  db.exec('DELETE FROM records; DELETE FROM users; DELETE FROM sqlite_sequence;');

  const hashPw = (pw) => bcrypt.hashSync(pw, 10);
  const now = new Date().toISOString();

  // ── DEMO USERS (is_demo = 1) ──────────────────────────────
  // These users share demo records and cannot modify real data.
  const insertUser = db.prepare(`
    INSERT INTO users (name, username, email, password, role, status, is_demo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const demoUsers = [
    ['Alice Chen',    'admin',   'alice@finledger.io',  hashPw('admin123'),   'admin',   'active'],
    ['Bob Rodriguez', 'analyst', 'bob@finledger.io',    hashPw('analyst123'), 'analyst', 'active'],
    ['Carol Smith',   'viewer',  'carol@finledger.io',  hashPw('viewer123'),  'viewer',  'active'],
    ['David Park',    'david',   'david@finledger.io',  hashPw('david123'),   'viewer',  'inactive'],
    ['Eva Wilson',    'eva',     'eva@finledger.io',    hashPw('eva123'),     'analyst', 'active'],
  ];

  demoUsers.forEach(u => insertUser.run(...u, now, now));
  console.log(`  ✓ ${demoUsers.length} demo users created`);

  // Get the demo admin's ID (Alice Chen — id=1) for created_by
  const demoAdmin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();

  // ── DEMO RECORDS (owned by demo admin) ───────────────────
  // These are only visible to is_demo users.
  const insertRecord = db.prepare(`
    INSERT INTO records (description, amount, type, category, date, notes, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoRecords = [
    ['Monthly Salary',       85000, 'income',  'salary',        '2024-11-01', 'November salary'],
    ['Apartment Rent',       22000, 'expense', 'utilities',     '2024-11-02', 'Monthly rent'],
    ['Grocery Shopping',      3200, 'expense', 'food',          '2024-11-05', 'Weekly groceries'],
    ['Freelance Project',    25000, 'income',  'freelance',     '2024-11-08', 'Web design project'],
    ['Electricity Bill',      1800, 'expense', 'utilities',     '2024-11-10', ''],
    ['Netflix + Spotify',      800, 'expense', 'entertainment', '2024-11-12', 'Subscriptions'],
    ['Restaurant Dinner',     2400, 'expense', 'food',          '2024-11-15', 'Team outing'],
    ['Stock Dividends',      12000, 'income',  'investment',    '2024-11-18', 'Q3 dividends'],
    ['Cab Rides',             1200, 'expense', 'transport',     '2024-11-20', ''],
    ['Medicine & Pharmacy',    950, 'expense', 'healthcare',    '2024-11-22', 'Monthly meds'],
    ['Monthly Salary',       85000, 'income',  'salary',        '2024-12-01', 'December salary'],
    ['Apartment Rent',       22000, 'expense', 'utilities',     '2024-12-02', 'Monthly rent'],
    ['Holiday Shopping',      8500, 'expense', 'shopping',      '2024-12-10', 'Gifts & clothes'],
    ['Consulting Income',    35000, 'income',  'freelance',     '2024-12-12', 'Q4 consulting'],
    ['Flight Tickets',       12000, 'expense', 'transport',     '2024-12-18', 'Holiday travel'],
    ['Monthly Salary',       90000, 'income',  'salary',        '2025-01-01', 'January — increment'],
    ['Apartment Rent',       22000, 'expense', 'utilities',     '2025-01-02', 'Monthly rent'],
    ['Online Course',         4999, 'expense', 'other',         '2025-01-08', 'Python ML course'],
    ['SIP Investment',       15000, 'expense', 'investment',    '2025-01-10', 'Mutual fund SIP'],
    ['Freelance Design',     18000, 'income',  'freelance',     '2025-01-15', 'Logo + branding'],
    ['Grocery & Household',   4200, 'expense', 'food',          '2025-01-18', 'BigBasket order'],
    ['Monthly Salary',       90000, 'income',  'salary',        '2025-02-01', ''],
    ['Apartment Rent',       22000, 'expense', 'utilities',     '2025-02-02', ''],
    ['Doctor Visit',          1500, 'expense', 'healthcare',    '2025-02-10', 'Annual checkup'],
    ['Dividend Payout',       8500, 'income',  'investment',    '2025-02-14', 'HDFC equity fund'],
    ['Electricity Bill',      2100, 'expense', 'utilities',     '2025-02-15', ''],
    ['Monthly Salary',       90000, 'income',  'salary',        '2025-03-01', ''],
    ['Apartment Rent',       24000, 'expense', 'utilities',     '2025-03-02', 'Rent increased'],
    ['Freelance App Dev',    42000, 'income',  'freelance',     '2025-03-10', 'React Native project'],
    ['New Laptop',           75000, 'expense', 'shopping',      '2025-03-15', 'MacBook Pro'],
    ['Cloud Subscriptions',   2500, 'expense', 'other',         '2025-03-20', 'AWS + Vercel'],
    ['Monthly Salary',       90000, 'income',  'salary',        '2025-04-01', ''],
    ['Apartment Rent',       24000, 'expense', 'utilities',     '2025-04-02', ''],
    ['Restaurant Outing',     3800, 'expense', 'food',          '2025-04-05', 'Birthday dinner'],
    ['Investment Returns',   22000, 'income',  'investment',    '2025-04-10', 'Portfolio gains'],
  ];

  demoRecords.forEach(r => insertRecord.run(...r, demoAdmin.id, now, now));
  console.log(`  ✓ ${demoRecords.length} demo records created (owned by demo admin)`);

  console.log('\n✅  Seed complete.\n');
  console.log('Demo accounts (read-only sandbox):');
  console.log('  admin   / admin123   → Admin role  (demo data, non-functional writes blocked in UI)');
  console.log('  analyst / analyst123 → Analyst role (demo data)');
  console.log('  viewer  / viewer123  → Viewer role  (demo data)');
  console.log('\nReal users: register at /register → empty isolated workspace\n');
}

seed().catch(console.error);
