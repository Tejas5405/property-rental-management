import { z } from 'zod';

export const createPaymentSchema = z.object({
  agreement_id: z.string().uuid('Invalid agreement_id'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  due_date: z.string().date('due_date must be YYYY-MM-DD'),
  status: z.enum(['paid', 'pending', 'overdue']).optional().default('pending'),
  method: z.string().max(50).nullable().optional(),
});

export const markPaidSchema = z.object({
  method: z.string().max(50).optional(),
});
