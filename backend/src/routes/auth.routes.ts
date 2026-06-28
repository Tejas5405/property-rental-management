import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new tenant account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Account created }
 *       400: { description: Validation error }
 */
router.post('/register', asyncHandler(AuthController.register));

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in and receive access + refresh tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: JWT tokens returned }
 *       401: { description: Invalid credentials }
 */
router.post('/login', asyncHandler(AuthController.login));

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send a password-reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent }
 */
router.post('/reset-password', asyncHandler(AuthController.resetPassword));

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out (client-side token invalidation)
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authenticate, asyncHandler(AuthController.logout));

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 */
router.get('/me', authenticate, asyncHandler(AuthController.me));

/**
 * @openapi
 * /api/auth/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (admin only)
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       403: { description: Forbidden }
 */
router.get('/users', authenticate, requireRole('admin'), asyncHandler(AuthController.listUsers));

/**
 * @openapi
 * /api/auth/users/{id}/role:
 *   put:
 *     tags: [Users]
 *     summary: Change a user's role (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, manager, tenant] }
 *     responses:
 *       200: { description: Role updated }
 *       403: { description: Forbidden }
 *       404: { description: User not found }
 */
router.put('/users/:id/role', authenticate, requireRole('admin'), asyncHandler(AuthController.updateRole));

/**
 * @openapi
 * /api/auth/users/{id}/active:
 *   put:
 *     tags: [Users]
 *     summary: Activate or deactivate a user (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active: { type: boolean }
 *     responses:
 *       200: { description: Status updated }
 *       403: { description: Forbidden }
 *       404: { description: User not found }
 */
router.put('/users/:id/active', authenticate, requireRole('admin'), asyncHandler(AuthController.setActive));

export default router;
