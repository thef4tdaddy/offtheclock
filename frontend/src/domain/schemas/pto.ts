import { z } from 'zod';

export const AccrualFrequencySchema = z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'annually']);

export const PTOCategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  accrual_rate: z.number(),
  accrual_frequency: AccrualFrequencySchema,
  current_balance: z.number(),
  starting_balance: z.number(),
  start_date: z.string(),
  max_balance: z.number().nullable().optional(),
  yearly_accrual_cap: z.number().nullable().optional(),
  annual_grant_amount: z.number().nullable().optional(),
  accrued_ytd: z.number().nullable().optional(),
});

export const PTOLogSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  date: z.string(),
  amount: z.number(),
  note: z.string().optional(),
  created_at: z.string().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accrual_rate: z.number(),
  accrual_frequency: z.string(), // Allowing string for flexibility in form, but validated against enum in logic if needed
  start_date: z.string(),
  starting_balance: z.number(),
  max_balance: z.number().nullable().optional(),
});

export const CreateLogSchema = z.object({
  category_id: z.number(),
  date: z.string(),
  amount: z.number(),
  note: z.string().optional(),
});

export type PTOCategory = z.infer<typeof PTOCategorySchema>;
export type PTOLog = z.infer<typeof PTOLogSchema>;
export type CreateCategoryPayload = z.infer<typeof CreateCategorySchema>;
export type CreateLogPayload = z.infer<typeof CreateLogSchema>;
