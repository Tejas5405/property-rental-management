import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).nullable().optional(),
});
