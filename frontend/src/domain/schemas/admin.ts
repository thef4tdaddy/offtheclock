import { z } from 'zod';
import { UserRoleSchema } from './user';

export const UserListItemSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  full_name: z.string().nullable().optional(),
  role: UserRoleSchema,
  created_at: z.string(),
});

export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
});

export const AdminUserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
  role: UserRoleSchema,
});

export const AuditLogEntrySchema = z.object({
  id: z.number(),
  admin_user_id: z.number(),
  action: z.string(),
  target_user_id: z.number().nullable().optional(),
  details: z.string().nullable().optional(),
  created_at: z.string(),
});

export const SystemSettingsItemSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const DatabaseMetricsSchema = z.object({
  total_users: z.number(),
  total_pto_categories: z.number(),
  total_shifts: z.number(),
  total_pto_logs: z.number(),
});

export type UserListItem = z.infer<typeof UserListItemSchema>;
export type UpdateUserRole = z.infer<typeof UpdateUserRoleSchema>;
export type AdminUserCreate = z.infer<typeof AdminUserCreateSchema>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
export type SystemSettingsItem = z.infer<typeof SystemSettingsItemSchema>;
export type DatabaseMetrics = z.infer<typeof DatabaseMetricsSchema>;
