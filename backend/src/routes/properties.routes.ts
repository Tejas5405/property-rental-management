import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'manager'), asyncHandler(PropertyController.list));
router.get('/:id', requireRole('admin', 'manager', 'tenant'), asyncHandler(PropertyController.get));
router.post('/', requireRole('admin', 'manager'), asyncHandler(PropertyController.create));
router.put('/:id', requireRole('admin', 'manager'), asyncHandler(PropertyController.update));
router.delete('/:id', requireRole('admin'), asyncHandler(PropertyController.remove));

export default router;
