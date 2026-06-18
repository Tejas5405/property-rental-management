import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/admin', requireRole('admin'), asyncHandler(DashboardController.admin));
router.get('/manager', requireRole('manager'), asyncHandler(DashboardController.manager));
router.get('/tenant', requireRole('tenant'), asyncHandler(DashboardController.tenant));

export default router;
