import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  address: z.string().min(1, 'Address is required').max(500),
  type: z.enum(['apartment', 'house', 'commercial', 'studio'], {
    errorMap: () => ({ message: 'Type must be apartment, house, commercial, or studio' }),
  }),
  rent: z.number().min(0, 'Rent must be non-negative').optional().default(0),
  bedrooms: z.number().int().min(0).optional().default(0),
  bathrooms: z.number().int().min(0).optional().default(0),
  status: z
    .enum(['vacant', 'occupied', 'maintenance'])
    .optional()
    .default('vacant'),
  manager_id: z.string().uuid().nullable().optional(),
});

export const updatePropertySchema = z.object({
  name: z.string().min(1).max(300).optional(),
  address: z.string().min(1).max(500).optional(),
  type: z.enum(['apartment', 'house', 'commercial', 'studio']).optional(),
  rent: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  status: z.enum(['vacant', 'occupied', 'maintenance']).optional(),
  manager_id: z.string().uuid().nullable().optional(),
});
