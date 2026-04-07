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

## Demo Accounts

| Username | Password    | Role    | Access                              |
|----------|-------------|---------|-------------------------------------|
| admin    | admin123    | Admin   | Full access — CRUD + Users + Analytics |
| analyst  | analyst123  | Analyst | Read records + Analytics            |
| viewer   | viewer123   | Viewer  | Read records only                   |

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

# ═══════════════════════════════════════════════
# STEP-BY-STEP SETUP & DEPLOYMENT GUIDE
# ═══════════════════════════════════════════════

## PHASE 1 — Prerequisites (Install Once)

### Step 1 — Install Node.js
1. Go to https://nodejs.org
2. Download **Node.js v20 LTS** (Long Term Support)
3. Run the installer — keep all defaults
4. Verify installation — open Terminal / Command Prompt:
   ```bash
   node --version    # should print v20.x.x
   npm --version     # should print 10.x.x
   ```

### Step 2 — Install Git
1. Go to https://git-scm.com/downloads
2. Download and install for your OS
3. Verify:
   ```bash
   git --version    # should print git version 2.x.x
   ```

---

## PHASE 2 — Run Locally

### Step 3 — Extract the project
Unzip `finledger.zip` to any folder, e.g. `~/projects/finledger`

### Step 4 — Setup the Backend

Open Terminal in the `finledger` folder and run:

```bash
# Navigate to backend
cd backend

# Install all backend dependencies
npm install
```

You will see npm downloading packages. This takes 1–2 minutes.

**Create the backend environment file:**

```bash
# Copy the example env file
cp .env.example .env
```

Open `backend/.env` in any text editor and set:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=my_super_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
DB_PATH=./data/finledger.db
CORS_ORIGINS=http://localhost:3000
```

> ⚠️ **Important:** Change `JWT_SECRET` to any random string of at least 32 characters.

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

### Step 5 — Setup the Frontend

**Open a NEW terminal window** (keep the backend running) and run:

```bash
# From the finledger root folder
cd frontend

# Install frontend dependencies
npm install
```

**Create the frontend environment file:**

```bash
cp .env.example .env
```

Open `frontend/.env` and set:

```env
VITE_API_URL=
```

> Leave `VITE_API_URL` empty — Vite's proxy will automatically forward `/api` calls to `localhost:5000`

**Start the frontend:**

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in 300 ms
  ➜  Local:   http://localhost:3000/
```

### Step 6 — Open the App

Open http://localhost:3000 in your browser.

**Login with any demo account:**
- `admin` / `admin123` → Full access
- `analyst` / `analyst123` → Read + Analytics  
- `viewer` / `viewer123` → Read only

---

## PHASE 3 — Push to GitHub

### Step 7 — Create a GitHub Account
1. Go to https://github.com
2. Click **Sign up** → create a free account
3. Verify your email

### Step 8 — Create a New Repository
1. Click the **+** icon (top-right) → **New repository**
2. Name it: `finledger`
3. Set to **Public**
4. Do NOT check "Initialize with README" (we have our own)
5. Click **Create repository**

### Step 9 — Push your code

In your terminal (from the `finledger` root folder):

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# First commit
git commit -m "feat: initial FinLedger full-stack application"

# Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/finledger.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Go to `https://github.com/YOUR_USERNAME/finledger` — you should see all files.

---

## PHASE 4 — Deploy Backend on Render (Free)

### Step 10 — Create a Render Account
1. Go to https://render.com
2. Click **Get Started for Free**
3. Sign up with your GitHub account (recommended — enables auto-deploy)

### Step 11 — Create a Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub account if prompted
3. Select your `finledger` repository
4. Fill in the settings:

| Field           | Value                              |
|-----------------|------------------------------------|
| Name            | `finledger-api`                    |
| Region          | Singapore (closest to India)       |
| Branch          | `main`                             |
| Root Directory  | `backend`                          |
| Runtime         | `Node`                             |
| Build Command   | `npm install && npm run seed`      |
| Start Command   | `npm start`                        |
| Instance Type   | **Free**                           |

5. Click **Advanced** → **Add Environment Variables** and add:

| Key             | Value                              |
|-----------------|------------------------------------|
| NODE_ENV        | `production`                       |
| JWT_SECRET      | (generate a 40+ char random string)|
| JWT_EXPIRES_IN  | `7d`                               |
| DB_PATH         | `./data/finledger.db`              |
| PORT            | `10000`                            |
| CORS_ORIGINS    | `*` (update after frontend deploy) |

6. Scroll down → click **Create Web Service**

Render will now build and deploy your backend. This takes **3–5 minutes**.

### Step 12 — Add a Persistent Disk (Important for SQLite!)

Free tier on Render has ephemeral storage — the database resets on each deploy.
To persist data:

1. In your Render service → **Disks** tab
2. Click **Add Disk**
3. Set:
   - Name: `finledger-data`
   - Mount Path: `/opt/render/project/src/data`
   - Size: **1 GB** (free)
4. Update your environment variable:
   - `DB_PATH` → `/opt/render/project/src/data/finledger.db`
5. Click **Save Changes** → service will redeploy

### Step 13 — Verify Backend is Live

Once deployed, Render gives you a URL like:
`https://finledger-api.onrender.com`

Test it:
```
https://finledger-api.onrender.com/health
→ {"status":"ok","uptime":...}

https://finledger-api.onrender.com/api/docs
→ Opens Swagger UI
```

> ⚠️ Free Render services **spin down after 15 mins of inactivity**. First request after inactivity takes ~30 seconds to wake up.

---

## PHASE 5 — Deploy Frontend on Vercel (Free)

### Step 14 — Create a Vercel Account
1. Go to https://vercel.com
2. Click **Sign Up**
3. Continue with GitHub (recommended)

### Step 15 — Deploy Frontend

1. Click **Add New Project**
2. Click **Import** next to your `finledger` repository
3. Configure:

| Field               | Value                              |
|---------------------|------------------------------------|
| Framework Preset    | Vite                               |
| Root Directory      | `frontend`                         |
| Build Command       | `npm run build`                    |
| Output Directory    | `dist`                             |
| Install Command     | `npm install`                      |

4. Click **Environment Variables** and add:

| Key          | Value                                        |
|--------------|----------------------------------------------|
| VITE_API_URL | `https://finledger-api.onrender.com`         |

> Replace with YOUR actual Render URL from Step 13

5. Click **Deploy**

Vercel builds and deploys in ~1 minute. You'll get a URL like:
`https://finledger.vercel.app`

### Step 16 — Update Backend CORS

Now that the frontend URL is known, update the backend's CORS setting:

1. Go to your Render service → **Environment**
2. Update `CORS_ORIGINS`:
   ```
   https://finledger.vercel.app
   ```
3. Click **Save Changes** → backend redeploys automatically

---

## PHASE 6 — Verify Everything Works

### Step 17 — Full System Test

1. Open `https://finledger.vercel.app` in browser
2. Login with `admin` / `admin123`
3. Verify Dashboard loads with charts and data
4. Go to Records → add a new record
5. Go to Analytics → verify charts load
6. Go to Users → verify user management works
7. Logout → login with `viewer` → verify Create/Edit buttons are hidden

**Test the API directly:**
```bash
# Login
curl -X POST https://finledger-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Copy the token from response, then:
curl https://finledger-api.onrender.com/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## PHASE 7 — Submission Details

### GitHub Repository URL
```
https://github.com/YOUR_USERNAME/finledger
```

### Live Demo URL
```
https://finledger.vercel.app
```

### API Documentation URL
```
https://finledger-api.onrender.com/api/docs
```

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
