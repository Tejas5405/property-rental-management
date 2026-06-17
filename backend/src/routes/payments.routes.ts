import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/summary', requireRole('admin', 'manager'), asyncHandler(PaymentController.summary));
router.get('/', requireRole('admin', 'manager', 'tenant'), asyncHandler(PaymentController.list));
router.post('/', requireRole('admin', 'manager'), asyncHandler(PaymentController.create));
router.put('/:id', requireRole('admin', 'manager'), asyncHandler(PaymentController.markPaid));

export default router;
