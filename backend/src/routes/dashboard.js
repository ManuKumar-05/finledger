// src/routes/dashboard.js

const router = require('express').Router();
const { authenticate, anyRole, analystPlus } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Summary and analytics APIs
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Overall financial summary (all roles)
 *     responses:
 *       200:
 *         description: Totals for income, expense, net balance, record count
 */
router.get('/summary',  authenticate, anyRole,     ctrl.summary);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Recent financial records (all roles)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Recent records }
 */
router.get('/recent',   authenticate, anyRole,     ctrl.recent);

/**
 * @swagger
 * /api/dashboard/monthly:
 *   get:
 *     tags: [Dashboard]
 *     summary: Monthly income/expense trend (Analyst + Admin)
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6, maximum: 24 }
 *     responses:
 *       200: { description: Monthly trend data }
 */
router.get('/monthly',  authenticate, analystPlus, ctrl.monthly);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Category-wise totals (Analyst + Admin)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: months
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Category breakdown }
 */
router.get('/categories', authenticate, analystPlus, ctrl.categories);

/**
 * @swagger
 * /api/dashboard/weekly:
 *   get:
 *     tags: [Dashboard]
 *     summary: Weekly income/expense for past 4 weeks (Analyst + Admin)
 *     responses:
 *       200: { description: Weekly data }
 */
router.get('/weekly',   authenticate, analystPlus, ctrl.weekly);

/**
 * @swagger
 * /api/dashboard/insights:
 *   get:
 *     tags: [Dashboard]
 *     summary: Computed KPIs — savings rate, top category, etc. (Analyst + Admin)
 *     responses:
 *       200: { description: KPI object }
 */
router.get('/insights', authenticate, analystPlus, ctrl.insights);

module.exports = router;
