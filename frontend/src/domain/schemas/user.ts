import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'employee']);

export const UserProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: UserRoleSchema,
  created_at: z.string(),
  full_name: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  shift_length: z.number().optional(),
  shifts_per_week: z.number().optional(),
});

export const UpdateProfileSchema = z.object({
  full_name: z.string().optional(),
  employer: z.string().optional(),
  avatar_url: z.string().optional(),
  shift_length: z.number().optional(),
  shifts_per_week: z.number().optional(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfilePayload = z.infer<typeof UpdateProfileSchema>;
