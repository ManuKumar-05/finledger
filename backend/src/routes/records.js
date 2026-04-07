// src/routes/records.js

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const { authenticate, adminOnly, anyRole } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/recordsController');

const VALID_CATEGORIES = ['salary','freelance','investment','food','transport','utilities','entertainment','healthcare','shopping','other'];
const VALID_TYPES = ['income','expense'];

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: Get all financial records (paginated, filtered)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [date, amount, description, created_at], default: date }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: List of records with pagination
 */
router.get('/', authenticate, anyRole, ctrl.getAll);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get a single record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Record found }
 *       404: { description: Not found }
 */
router.get('/:id',
  authenticate, anyRole,
  [param('id').isInt({ min: 1 }).withMessage('Invalid ID')],
  validate,
  ctrl.getOne
);

/**
 * @swagger
 * /api/records:
 *   post:
 *     tags: [Records]
 *     summary: Create a new financial record (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, amount, type, category, date]
 *             properties:
 *               description: { type: string, example: Monthly Salary }
 *               amount:      { type: number, example: 85000 }
 *               type:        { type: string, enum: [income, expense] }
 *               category:    { type: string, example: salary }
 *               date:        { type: string, format: date }
 *               notes:       { type: string }
 *     responses:
 *       201: { description: Record created }
 *       403: { description: Forbidden }
 *       422: { description: Validation error }
 */
router.post('/',
  authenticate, adminOnly,
  [
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
    body('type').isIn(VALID_TYPES).withMessage('Type must be income or expense'),
    body('category').isIn(VALID_CATEGORIES).withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
    body('date').isDate({ format: 'YYYY-MM-DD' }).withMessage('Date must be YYYY-MM-DD'),
    body('notes').optional().trim(),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     tags: [Records]
 *     summary: Update a financial record (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.put('/:id',
  authenticate, adminOnly,
  [
    param('id').isInt({ min: 1 }),
    body('description').optional().notEmpty().trim(),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
    body('type').optional().isIn(VALID_TYPES),
    body('category').optional().isIn(VALID_CATEGORIES),
    body('date').optional().isDate({ format: 'YYYY-MM-DD' }),
    body('notes').optional().trim(),
  ],
  validate,
  ctrl.update
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft-delete a financial record (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Forbidden }
 */
router.delete('/:id',
  authenticate, adminOnly,
  [param('id').isInt({ min: 1 })],
  validate,
  ctrl.remove
);

module.exports = router;
