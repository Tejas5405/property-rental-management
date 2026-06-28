import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: List all tenants (admin, manager)
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Tenant' }
 */
router.get('/', requireRole('admin', 'manager'), asyncHandler(TenantController.list));

/**
 * @openapi
 * /api/tenants/me:
 *   get:
 *     tags: [Tenants]
 *     summary: Get current tenant's own profile
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tenant' }
 *       404: { description: No tenant profile linked }
 */
router.get('/me', requireRole('tenant'), asyncHandler(TenantController.me));

/**
 * @openapi
 * /api/tenants/{id}:
 *   get:
 *     tags: [Tenants]
 *     summary: Get a tenant by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tenant' }
 *       404: { description: Not found }
 */
router.get('/:id', requireRole('admin', 'manager', 'tenant'), asyncHandler(TenantController.get));

/**
 * @openapi
 * /api/tenants:
 *   post:
 *     tags: [Tenants]
 *     summary: Create a tenant (admin, manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               user_id: { type: string, format: uuid }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tenant' }
 */
router.post('/', requireRole('admin', 'manager'), asyncHandler(TenantController.create));

/**
 * @openapi
 * /api/tenants/{id}:
 *   put:
 *     tags: [Tenants]
 *     summary: Update a tenant profile
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
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Tenant' }
 *       404: { description: Not found }
 */
router.put('/:id', requireRole('admin', 'manager', 'tenant'), asyncHandler(TenantController.update));

/**
 * @openapi
 * /api/tenants/{id}:
 *   delete:
 *     tags: [Tenants]
 *     summary: Delete a tenant (admin only, fails if active agreement exists)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       409: { description: Tenant has an active agreement }
 */
router.delete('/:id', requireRole('admin'), asyncHandler(TenantController.remove));

export default router;
