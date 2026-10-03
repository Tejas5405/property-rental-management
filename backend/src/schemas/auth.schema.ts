import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'tenant'], {
    errorMap: () => ({ message: 'Role must be admin, manager, or tenant' }),
  }),
});

export const setActiveSchema = z.object({
  is_active: z.boolean({ required_error: 'is_active (boolean) is required' }),
});
