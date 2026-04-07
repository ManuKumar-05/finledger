// src/server.js
// FinLedger API — Express application entry point

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Auto-migrate on startup
const db = require('./config/database');
require('./utils/migrate')();

const app = express();

// ── Security & Performance ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // allow Swagger UI
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate Limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body Parser ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Swagger Docs ────────────────────────────────────────────
const swaggerSpec = require('./config/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'FinLedger API Docs',
  customCss: `
    .swagger-ui .topbar { background: #0a0d11; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after { content: 'FinLedger API'; color: #00e5b4; font-size: 20px; font-weight: 700; }
  `,
}));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/records',   require('./routes/records'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users',     require('./routes/users'));

// ── Serve Frontend (production) ─────────────────────────────
// When deployed, the built frontend is in /frontend/dist
const frontendDist = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// ── Error Handlers ──────────────────────────────────────────
const { notFound, globalError } = require('./middleware/errorHandler');
app.use(notFound);
app.use(globalError);

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  FinLedger API running on http://localhost:${PORT}`);
  console.log(`📚  Swagger docs: http://localhost:${PORT}/api/docs`);
  console.log(`🌡️   Health check: http://localhost:${PORT}/health`);
  console.log(`🔐  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
