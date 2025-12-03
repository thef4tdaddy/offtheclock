import { z } from 'zod';

// Enums
export const UserRoleEnum = z.enum(['admin', 'user']); // Adjust based on actual backend enum values if different
export const AccrualFrequencyEnum = z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']); // Adjust based on actual backend enum values

// User Schemas
export const UserBaseSchema = z.object({
  email: z.string().email(),
  full_name: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const UserUpdateSchema = UserBaseSchema.partial();

export const UserSchema = UserBaseSchema.extend({
  id: z.number(),
  role: UserRoleEnum,
  created_at: z.string().datetime(), // ISO string from backend
});

// PTO Log Schemas
export const PTOLogBaseSchema = z.object({
  date: z.string().datetime(),
  amount: z.number(),
  note: z.string().nullable().optional(),
});

export const PTOLogCreateSchema = PTOLogBaseSchema.extend({
  category_id: z.number(),
});

export const PTOLogSchema = PTOLogBaseSchema.extend({
  id: z.number(),
  category_id: z.number(),
  created_at: z.string().datetime(),
});

// PTO Category Schemas
export const PTOCategoryBaseSchema = z.object({
  name: z.string(),
  accrual_rate: z.number(),
  accrual_frequency: AccrualFrequencyEnum,
  max_balance: z.number().nullable().optional(),
  start_date: z.string().datetime(),
  starting_balance: z.number().default(0.0),
});

export const PTOCategoryCreateSchema = PTOCategoryBaseSchema;

export const PTOCategorySchema = PTOCategoryBaseSchema.extend({
  id: z.number(),
  user_id: z.number(),
  current_balance: z.number(),
  projected_balance: z.number().nullable().optional(),
});

export const BalanceProjectionSchema = z.object({
  date: z.string().datetime(),
  projected_balance: z.number(),
});

// Types inferred from Schemas
export type User = z.infer<typeof UserSchema>;
export type PTOLog = z.infer<typeof PTOLogSchema>;
export type PTOCategory = z.infer<typeof PTOCategorySchema>;
export type BalanceProjection = z.infer<typeof BalanceProjectionSchema>;
