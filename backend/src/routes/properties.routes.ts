import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/properties:
 *   get:
 *     tags: [Properties]
 *     summary: List properties (admin sees all, manager sees own)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [vacant, occupied, maintenance] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Property' }
 */
router.get('/', requireRole('admin', 'manager'), asyncHandler(PropertyController.list));

/**
 * @openapi
 * /api/properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a single property
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Property' }
 *       404: { description: Not found }
 */
router.get('/:id', requireRole('admin', 'manager', 'tenant'), asyncHandler(PropertyController.get));

/**
 * @openapi
 * /api/properties:
 *   post:
 *     tags: [Properties]
 *     summary: Create a property (admin, manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, type]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               type: { type: string, enum: [apartment, house, commercial, studio] }
 *               rent: { type: number }
 *               bedrooms: { type: integer }
 *               bathrooms: { type: integer }
 *               status: { type: string, enum: [vacant, occupied, maintenance] }
 *               manager_id: { type: string, format: uuid }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Property' }
 */
router.post('/', requireRole('admin', 'manager'), asyncHandler(PropertyController.create));

/**
 * @openapi
 * /api/properties/{id}:
 *   put:
 *     tags: [Properties]
 *     summary: Update a property
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Property' }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Property' }
 *       404: { description: Not found }
 */
router.put('/:id', requireRole('admin', 'manager'), asyncHandler(PropertyController.update));

/**
 * @openapi
 * /api/properties/{id}:
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a property (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.delete('/:id', requireRole('admin'), asyncHandler(PropertyController.remove));

export default router;
