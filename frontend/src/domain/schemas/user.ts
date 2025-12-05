import { z } from 'zod';

export const UserProfileSchema = z.object({
  email: z.string().email(),
  full_name: z.string().optional(),
  employer: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  full_name: z.string().optional(),
  employer: z.string().optional(),
  avatar_url: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfilePayload = z.infer<typeof UpdateProfileSchema>;
