import { Router } from 'express';
import { AgreementController } from '../controllers/agreement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/agreements:
 *   get:
 *     tags: [Agreements]
 *     summary: List agreements (scoped by role)
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Agreement' }
 */
router.get('/', requireRole('admin', 'manager', 'tenant'), asyncHandler(AgreementController.list));

/**
 * @openapi
 * /api/agreements:
 *   post:
 *     tags: [Agreements]
 *     summary: Create a lease agreement (property must be vacant)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, tenant_id, start_date, end_date, rent]
 *             properties:
 *               property_id: { type: string, format: uuid }
 *               tenant_id: { type: string, format: uuid }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               rent: { type: number }
 *               deposit: { type: number }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Agreement' }
 *       409: { description: Property is occupied or already has an active agreement }
 */
router.post('/', requireRole('admin', 'manager'), asyncHandler(AgreementController.create));

/**
 * @openapi
 * /api/agreements/{id}/renew:
 *   put:
 *     tags: [Agreements]
 *     summary: Renew an active agreement with a new end date
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
 *             required: [end_date]
 *             properties:
 *               end_date: { type: string, format: date }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Agreement' }
 *       400: { description: New end date must be after current end date }
 *       409: { description: Agreement is not active }
 */
router.put('/:id/renew', requireRole('admin', 'manager'), asyncHandler(AgreementController.renew));

/**
 * @openapi
 * /api/agreements/{id}/terminate:
 *   put:
 *     tags: [Agreements]
 *     summary: Terminate an active agreement (frees the property)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Agreement' }
 *       409: { description: Agreement is not active }
 */
router.put('/:id/terminate', requireRole('admin', 'manager'), asyncHandler(AgreementController.terminate));

export default router;
