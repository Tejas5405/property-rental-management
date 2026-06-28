import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { createPaymentSchema, markPaidSchema } from '../schemas/payment.schema';

const router = Router();
router.use(authenticate);

router.get('/summary', requireRole('admin', 'manager'), asyncHandler(PaymentController.summary));
router.get('/', requireRole('admin', 'manager', 'tenant'), asyncHandler(PaymentController.list));
router.post('/', requireRole('admin', 'manager'), validate(createPaymentSchema), asyncHandler(PaymentController.create));
router.put('/:id', requireRole('admin', 'manager'), validate(markPaidSchema), asyncHandler(PaymentController.markPaid));

export default router;
