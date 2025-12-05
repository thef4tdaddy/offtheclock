import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export type LoginCredentials = z.infer<typeof LoginSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
