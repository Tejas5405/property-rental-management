import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { createPropertySchema, updatePropertySchema } from '../schemas/property.schema';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'manager'), asyncHandler(PropertyController.list));
router.get('/:id', requireRole('admin', 'manager', 'tenant'), asyncHandler(PropertyController.get));
router.post('/', requireRole('admin', 'manager'), validate(createPropertySchema), asyncHandler(PropertyController.create));
router.put('/:id', requireRole('admin', 'manager'), validate(updatePropertySchema), asyncHandler(PropertyController.update));
router.delete('/:id', requireRole('admin'), asyncHandler(PropertyController.remove));

export default router;
