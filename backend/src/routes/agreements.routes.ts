import { Router } from 'express';
import { AgreementController } from '../controllers/agreement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'manager', 'tenant'), asyncHandler(AgreementController.list));
router.post('/', requireRole('admin', 'manager'), asyncHandler(AgreementController.create));
router.put('/:id/renew', requireRole('admin', 'manager'), asyncHandler(AgreementController.renew));
router.put('/:id/terminate', requireRole('admin', 'manager'), asyncHandler(AgreementController.terminate));

export default router;
