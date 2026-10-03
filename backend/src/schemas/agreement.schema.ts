import { z } from 'zod';

export const createAgreementSchema = z
  .object({
    property_id: z.string().uuid('Invalid property_id'),
    tenant_id: z.string().uuid('Invalid tenant_id'),
    start_date: z.string().date('start_date must be YYYY-MM-DD'),
    end_date: z.string().date('end_date must be YYYY-MM-DD'),
    rent: z.number().min(0, 'Rent must be non-negative'),
    deposit: z.number().min(0).optional().default(0),
  })
  .refine((d) => d.end_date > d.start_date, {
    message: 'end_date must be after start_date',
    path: ['end_date'],
  });

export const renewAgreementSchema = z.object({
  end_date: z.string().date('end_date must be YYYY-MM-DD'),
});
