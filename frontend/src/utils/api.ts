import axios, { type AxiosRequestConfig } from 'axios';
import { z } from 'zod';

// Base Axios instance
export const api = axios.create({
  baseURL: '/api', // Vercel rewrites handle this
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic fetcher with Zod validation
export async function fetcher<T>(
  url: string,
  schema: z.ZodType<T>,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.get(url, config);

  // Validate the response data against the schema
  // This ensures runtime type safety
  const result = schema.safeParse(response.data);

  if (!result.success) {
    console.error(`Validation error for ${url}:`, result.error);
    throw new Error(`API Validation Error: ${result.error.message}`);
  }

  return result.data;
}

// Generic poster with Zod validation for response
export async function poster<T, D>(
  url: string,
  data: D,
  responseSchema: z.ZodType<T>,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.post(url, data, config);

  const result = responseSchema.safeParse(response.data);

  if (!result.success) {
    console.error(`Validation error for ${url}:`, result.error);
    throw new Error(`API Validation Error: ${result.error.message}`);
  }

  return result.data;
}
