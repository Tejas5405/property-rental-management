import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { createTenantSchema, updateTenantSchema } from '../schemas/tenant.schema';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'manager'), asyncHandler(TenantController.list));
router.get('/me', requireRole('tenant'), asyncHandler(TenantController.me));
router.get('/:id', requireRole('admin', 'manager', 'tenant'), asyncHandler(TenantController.get));
router.post('/', requireRole('admin', 'manager'), validate(createTenantSchema), asyncHandler(TenantController.create));
router.put('/:id', requireRole('admin', 'manager', 'tenant'), validate(updateTenantSchema), asyncHandler(TenantController.update));
router.delete('/:id', requireRole('admin'), asyncHandler(TenantController.remove));

export default router;
