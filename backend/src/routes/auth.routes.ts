import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  updateRoleSchema,
  setActiveSchema,
} from '../schemas/auth.schema';

const router = Router();

// Public
router.post('/register', validate(registerSchema), asyncHandler(AuthController.register));
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(AuthController.resetPassword));

// Authenticated
router.post('/logout', authenticate, asyncHandler(AuthController.logout));
router.get('/me', authenticate, asyncHandler(AuthController.me));
router.get('/users', authenticate, requireRole('admin'), asyncHandler(AuthController.listUsers));
router.put('/users/:id/role', authenticate, requireRole('admin'), validate(updateRoleSchema), asyncHandler(AuthController.updateRole));
router.put('/users/:id/active', authenticate, requireRole('admin'), validate(setActiveSchema), asyncHandler(AuthController.setActive));

export default router;
