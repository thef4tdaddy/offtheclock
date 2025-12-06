import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import type {
  UserListItem,
  UpdateUserRole,
  AdminUserCreate,
  AuditLogEntry,
  SystemSettingsItem,
  DatabaseMetrics,
} from '../../domain/schemas/admin';

export const useAdminUsers = () => {
  return useQuery<UserListItem[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers(),
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleUpdate }: { userId: number; roleUpdate: UpdateUserRole }) =>
      adminService.updateUserRole(userId, roleUpdate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: AdminUserCreate) => adminService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
    },
  });
};

export const useAdminSettings = () => {
  return useQuery<SystemSettingsItem[]>({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSettings(),
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useAdminMetrics = () => {
  return useQuery<DatabaseMetrics>({
    queryKey: ['admin', 'metrics'],
    queryFn: () => adminService.getMetrics(),
  });
};

export const useAuditLogs = (skip = 0, limit = 100) => {
  return useQuery<AuditLogEntry[]>({
    queryKey: ['admin', 'audit-logs', skip, limit],
    queryFn: () => adminService.getAuditLogs(skip, limit),
  });
};
