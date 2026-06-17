import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

// Public
router.post('/register', asyncHandler(AuthController.register));
router.post('/login', asyncHandler(AuthController.login));
router.post('/reset-password', asyncHandler(AuthController.resetPassword));

// Authenticated
router.post('/logout', authenticate, asyncHandler(AuthController.logout));
router.get('/me', authenticate, asyncHandler(AuthController.me));
router.get('/users', authenticate, requireRole('admin'), asyncHandler(AuthController.listUsers));
router.put('/users/:id/role', authenticate, requireRole('admin'), asyncHandler(AuthController.updateRole));
router.put('/users/:id/active', authenticate, requireRole('admin'), asyncHandler(AuthController.setActive));

export default router;
