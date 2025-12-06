import axios from 'axios';
import {
  UserListItemSchema,
  AuditLogEntrySchema,
  SystemSettingsItemSchema,
  DatabaseMetricsSchema,
  type UserListItem,
  type UpdateUserRole,
  type AdminUserCreate,
  type AuditLogEntry,
  type SystemSettingsItem,
  type DatabaseMetrics,
} from '../domain/schemas/admin';
import { z } from 'zod';

export const adminService = {
  async listUsers(): Promise<UserListItem[]> {
    const response = await axios.get('/api/admin/users');
    return z.array(UserListItemSchema).parse(response.data);
  },

  async updateUserRole(userId: number, roleUpdate: UpdateUserRole): Promise<UserListItem> {
    const response = await axios.put(`/api/admin/users/${userId}/role`, roleUpdate);
    return UserListItemSchema.parse(response.data);
  },

  async createUser(userData: AdminUserCreate): Promise<UserListItem> {
    const response = await axios.post('/api/admin/users', userData);
    return UserListItemSchema.parse(response.data);
  },

  async deleteUser(userId: number): Promise<void> {
    await axios.delete(`/api/admin/users/${userId}`);
  },

  async getSettings(): Promise<SystemSettingsItem[]> {
    const response = await axios.get('/api/admin/settings');
    return z.array(SystemSettingsItemSchema).parse(response.data);
  },

  async updateSetting(key: string, value: string): Promise<SystemSettingsItem> {
    const response = await axios.put(`/api/admin/settings/${key}`, value, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return SystemSettingsItemSchema.parse(response.data);
  },

  async getMetrics(): Promise<DatabaseMetrics> {
    const response = await axios.get('/api/admin/metrics');
    return DatabaseMetricsSchema.parse(response.data);
  },

  async getAuditLogs(skip = 0, limit = 100): Promise<AuditLogEntry[]> {
    const response = await axios.get('/api/admin/audit-logs', {
      params: { skip, limit },
    });
    return z.array(AuditLogEntrySchema).parse(response.data);
  },
};
