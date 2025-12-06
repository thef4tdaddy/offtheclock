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
    try {
      const response = await axios.get('/api/admin/users');
      return z.array(UserListItemSchema).parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list users: ${message}`);
    }
  },

  async updateUserRole(userId: number, roleUpdate: UpdateUserRole): Promise<UserListItem> {
    try {
      const response = await axios.put(`/api/admin/users/${userId}/role`, roleUpdate);
      return UserListItemSchema.parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update user role: ${message}`);
    }
  },

  async createUser(userData: AdminUserCreate): Promise<UserListItem> {
    try {
      const response = await axios.post('/api/admin/users', userData);
      return UserListItemSchema.parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create user: ${message}`);
    }
  },

  async deleteUser(userId: number): Promise<void> {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to delete user: ${message}`);
    }
  },

  async getSettings(): Promise<SystemSettingsItem[]> {
    try {
      const response = await axios.get('/api/admin/settings');
      return z.array(SystemSettingsItemSchema).parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get settings: ${message}`);
    }
  },

  async updateSetting(key: string, value: string): Promise<SystemSettingsItem> {
    try {
      const response = await axios.put(`/api/admin/settings/${key}`, { value });
      return SystemSettingsItemSchema.parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update setting: ${message}`);
    }
  },

  async getMetrics(): Promise<DatabaseMetrics> {
    try {
      const response = await axios.get('/api/admin/metrics');
      return DatabaseMetricsSchema.parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get metrics: ${message}`);
    }
  },

  async getAuditLogs(skip = 0, limit = 100): Promise<AuditLogEntry[]> {
    try {
      const response = await axios.get('/api/admin/audit-logs', {
        params: { skip, limit },
      });
      return z.array(AuditLogEntrySchema).parse(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get audit logs: ${message}`);
    }
  },
};
