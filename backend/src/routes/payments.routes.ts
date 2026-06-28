import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/payments/summary:
 *   get:
 *     tags: [Payments]
 *     summary: Monthly payment summary (admin, manager)
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Summary object }
 */
router.get('/summary', requireRole('admin', 'manager'), asyncHandler(PaymentController.summary));

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments (scoped by role)
 *     parameters:
 *       - in: query
 *         name: agreementId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Payment' }
 */
router.get('/', requireRole('admin', 'manager', 'tenant'), asyncHandler(PaymentController.list));

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Record a payment (admin, manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agreement_id, amount, due_date]
 *             properties:
 *               agreement_id: { type: string, format: uuid }
 *               amount: { type: number }
 *               due_date: { type: string, format: date }
 *               status: { type: string, enum: [paid, pending, overdue] }
 *               method: { type: string }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payment' }
 */
router.post('/', requireRole('admin', 'manager'), asyncHandler(PaymentController.create));

/**
 * @openapi
 * /api/payments/{id}:
 *   put:
 *     tags: [Payments]
 *     summary: Mark a payment as paid (admin, manager)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Payment' }
 *       404: { description: Not found }
 */
router.put('/:id', requireRole('admin', 'manager'), asyncHandler(PaymentController.markPaid));

export default router;
