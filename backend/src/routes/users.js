// src/routes/users.js

const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/usersController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, analyst, viewer] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: User list }
 *       403: { description: Admin only }
 */
router.get('/', authenticate, adminOnly, ctrl.getAll);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User found }
 *       404: { description: Not found }
 */
router.get('/:id', authenticate, adminOnly, [param('id').isInt()], validate, ctrl.getOne);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, username, email, password]
 *             properties:
 *               name:     { type: string }
 *               username: { type: string }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role:     { type: string, enum: [admin, analyst, viewer], default: viewer }
 *               status:   { type: string, enum: [active, inactive], default: active }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Username/email already exists }
 */
router.post('/',
  authenticate, adminOnly,
  [
    body('name').notEmpty().trim().withMessage('Name required'),
    body('username').notEmpty().trim().isAlphanumeric().withMessage('Username must be alphanumeric'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').optional().isIn(['admin','analyst','viewer']),
    body('status').optional().isIn(['active','inactive']),
  ],
  validate,
  ctrl.create
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id',
  authenticate, adminOnly,
  [
    param('id').isInt(),
    body('name').optional().notEmpty().trim(),
    body('username').optional().isAlphanumeric(),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').optional().isIn(['admin','analyst','viewer']),
    body('status').optional().isIn(['active','inactive']),
  ],
  validate,
  ctrl.update
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
router.delete('/:id', authenticate, adminOnly, [param('id').isInt()], validate, ctrl.remove);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Toggle user active/inactive (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status toggled }
 */
router.patch('/:id/status', authenticate, adminOnly, [param('id').isInt()], validate, ctrl.toggleStatus);

module.exports = router;
