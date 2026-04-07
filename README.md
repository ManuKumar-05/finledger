# FinLedger — Finance Dashboard System

A production-ready full-stack finance dashboard with role-based access control, financial records management, analytics, and user management.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js + Express.js                |
| Database   | SQLite (via better-sqlite3)         |
| Auth       | JWT (jsonwebtoken + bcryptjs)       |
| Frontend   | React 18 + Vite + React Router v6   |
| API Docs   | Swagger UI (OpenAPI 3.0)            |
| Deployment | Backend → Render · Frontend → Vercel|

---

## Project Structure

```
finledger/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # SQLite connection
│   │   │   └── swagger.js       # OpenAPI spec
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── recordsController.js
│   │   │   ├── dashboardController.js
│   │   │   └── usersController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify + role guards
│   │   │   └── errorHandler.js  # Validation + global errors
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── records.js
│   │   │   ├── dashboard.js
│   │   │   └── users.js
│   │   ├── utils/
│   │   │   ├── migrate.js       # DDL / table creation
│   │   │   └── seed.js          # Demo data seeder
│   │   └── server.js            # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Shared UI (Button, Modal, Toast…)
│   │   │   └── layout/          # Sidebar, AppLayout, PageHeader
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Global auth state + JWT
│   │   │   └── ToastContext.jsx # Notification system
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Records.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Users.jsx
│   │   ├── utils/
│   │   │   ├── api.js           # Axios instance + typed API calls
│   │   │   └── format.js        # Currency, date, helpers
│   │   ├── styles/global.css
│   │   ├── App.jsx              # Routes + Protected wrappers
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   └── .env.example
├── render.yaml                  # Render deployment config
├── package.json                 # Root convenience scripts
└── .gitignore
```

---

## API Endpoints

### Auth
| Method | Endpoint                    | Access | Description              |
|--------|-----------------------------|--------|--------------------------|
| POST   | /api/auth/login             | Public | Login, get JWT token     |
| GET    | /api/auth/me                | All    | Get current user profile |
| POST   | /api/auth/change-password   | All    | Change own password      |

### Records
| Method | Endpoint          | Access | Description              |
|--------|-------------------|--------|--------------------------|
| GET    | /api/records      | All    | List (paginated+filtered)|
| GET    | /api/records/:id  | All    | Get single record        |
| POST   | /api/records      | Admin  | Create record            |
| PUT    | /api/records/:id  | Admin  | Update record            |
| DELETE | /api/records/:id  | Admin  | Soft-delete record       |

### Dashboard
| Method | Endpoint                    | Access         | Description         |
|--------|-----------------------------|----------------|---------------------|
| GET    | /api/dashboard/summary      | All            | Totals & counts     |
| GET    | /api/dashboard/recent       | All            | Latest records      |
| GET    | /api/dashboard/monthly      | Analyst+Admin  | Monthly trend       |
| GET    | /api/dashboard/weekly       | Analyst+Admin  | Weekly trend        |
| GET    | /api/dashboard/categories   | Analyst+Admin  | Category breakdown  |
| GET    | /api/dashboard/insights     | Analyst+Admin  | KPIs & metrics      |

### Users
| Method | Endpoint                    | Access | Description         |
|--------|-----------------------------|--------|---------------------|
| GET    | /api/users                  | Admin  | List users          |
| GET    | /api/users/:id              | Admin  | Get user            |
| POST   | /api/users                  | Admin  | Create user         |
| PUT    | /api/users/:id              | Admin  | Update user         |
| DELETE | /api/users/:id              | Admin  | Delete user         |
| PATCH  | /api/users/:id/status       | Admin  | Toggle active/inactive |

---

## Run Locally

### Step 1 — Extract the project
Unzip `finledger.zip` to any folder, e.g. `~/projects/finledger`

### Step 2 — Setup the Backend

Open Terminal in the `finledger` folder and run:

```bash
# Navigate to backend
cd backend

# Install all backend dependencies
npm install
```

You will see npm downloading packages. This takes 1–2 minutes.

**Seed the database with demo data:**

```bash
npm run seed
```

You should see:
```
✅  Migrations complete.
🌱  Seeding database...
  ✓ 5 users created
  ✓ 35 records created
✅  Seed complete.
```

**Start the backend server:**

```bash
npm run dev
```

You should see:
```
🚀  FinLedger API running on http://localhost:5000
📚  Swagger docs: http://localhost:5000/api/docs
```

Open http://localhost:5000/api/docs in your browser — you should see the Swagger API documentation.

### Step 3 — Setup the Frontend

**Open a NEW terminal window** (keep the backend running) and run:

```bash
# From the finledger root folder
cd frontend

# Install frontend dependencies
npm install
```

**Start the frontend:**

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 300 ms
  ➜  Local:   http://localhost:3000/
```

### Step 4 — Open the App

Open http://localhost:3000 in your browser.

---

### Primary Framework
**Node.js (Express)**

### Features Implemented
- ✅ User and Role Management
- ✅ Financial Records CRUD
- ✅ Record Filtering (date, category, type, search)
- ✅ Dashboard Summary APIs (totals, trends, categories)
- ✅ Role-Based Access Control (Admin / Analyst / Viewer)
- ✅ Input Validation and Error Handling
- ✅ Data Persistence (SQLite database)
- ✅ Pagination (server-side)
- ✅ Soft Delete
- ✅ JWT Authentication
- ✅ Swagger API Documentation
- ✅ Rate Limiting
- ✅ React Frontend connected to backend

---

## Technical Decisions & Trade-offs

### Database: SQLite over PostgreSQL
**Why:** SQLite requires zero infrastructure setup, runs as a file, and is perfectly adequate for this scale. The `better-sqlite3` driver uses synchronous APIs which dramatically simplifies error handling in Express without sacrificing performance for single-server workloads.  
**Trade-off:** Not suitable for multi-instance horizontal scaling. For production scale, swap the `database.js` config for `pg` (PostgreSQL) — the controller SQL is standard and portable.

### better-sqlite3 Synchronous API
**Why:** Avoids callback/promise chains in controllers. Every DB call is a single line. Express can handle thousands of concurrent requests even with synchronous DB calls because SQLite operations are microsecond-fast for this data size.  
**Trade-off:** If a query ever takes >100ms (complex aggregation on millions of rows), it blocks the event loop. Mitigated by indexes and query design.

### JWT Stateless Auth
**Why:** No session store needed, works across frontend/backend separation, scales horizontally.  
**Trade-off:** Tokens cannot be individually invalidated before expiry. Mitigated by short expiry (7d) and the `status` check on every request (deactivated users are rejected even with valid tokens).

### Soft Delete for Records
**Why:** Audit trail — deleted records can be recovered by admin if needed. The `deleted = 0` index makes queries fast.

### CSS Modules for Frontend
**Why:** Zero runtime overhead (vs CSS-in-JS), scoped styles prevent conflicts, works natively with Vite.

### Monorepo Structure
**Why:** Single git repository with `backend/` and `frontend/` subdirectories simplifies development, CI/CD, and code sharing. Each subdirectory has its own `package.json` for independent dependency management.

---

## Local Development Commands Reference

```bash
# Install everything
npm run install:all        # from root — installs backend + frontend deps

# Backend
cd backend
npm run dev                # start with nodemon (auto-restart)
npm run seed               # reset + reseed database
npm start                  # production start

# Frontend
cd frontend
npm run dev                # start Vite dev server
npm run build              # production build → dist/
npm run preview            # preview production build locally
```

---

## Environment Variables Reference

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=<random_string_min_32_chars>
JWT_EXPIRES_IN=7d
DB_PATH=./data/finledger.db
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### Frontend (`frontend/.env`)
```env
# Local dev — leave blank (Vite proxy handles /api → localhost:5000)
VITE_API_URL=

# Production — set to your deployed backend URL
# VITE_API_URL=https://finledger-api.onrender.com
```
