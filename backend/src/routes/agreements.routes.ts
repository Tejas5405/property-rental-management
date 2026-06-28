import { Router } from 'express';
import { AgreementController } from '../controllers/agreement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { createAgreementSchema, renewAgreementSchema } from '../schemas/agreement.schema';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'manager', 'tenant'), asyncHandler(AgreementController.list));
router.post('/', requireRole('admin', 'manager'), validate(createAgreementSchema), asyncHandler(AgreementController.create));
router.put('/:id/renew', requireRole('admin', 'manager'), validate(renewAgreementSchema), asyncHandler(AgreementController.renew));
router.put('/:id/terminate', requireRole('admin', 'manager'), asyncHandler(AgreementController.terminate));

export default router;
