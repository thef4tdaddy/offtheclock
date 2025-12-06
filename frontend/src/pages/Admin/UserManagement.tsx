import React, { useState } from 'react';
import { Trash2, Shield, User } from 'lucide-react';
import {
  useAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
} from '../../hooks/api/useAdmin';
import type { UserListItem } from '../../domain/schemas/admin';

const UserManagement: React.FC = () => {
  const { data: users, isLoading } = useAdminUsers();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const handleRoleToggle = (user: UserListItem) => {
    const newRole = user.role === 'admin' ? 'employee' : 'admin';
    updateRoleMutation.mutate({
      userId: user.id,
      roleUpdate: { role: newRole },
    });
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
    setConfirmDelete(null);
  };

  if (isLoading) {
    return <div className="text-text-muted">Loading users...</div>;
  }

  return (
    <div className="bg-surface-base p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-text-main mb-6">User Management</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-default">
          <thead className="bg-surface-hover">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-base divide-y divide-border-default">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-surface-hover">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  {user.full_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-accent-warning bg-opacity-20 text-accent-warning'
                        : 'bg-surface-hover text-text-muted'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : (
                      <User className="w-3 h-3 mr-1" />
                    )}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleRoleToggle(user)}
                    disabled={updateRoleMutation.isPending}
                    className="text-accent-info hover:text-accent-info-hover disabled:opacity-50"
                  >
                    {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  {confirmDelete === user.id ? (
                    <>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending}
                        className="text-accent-error hover:text-accent-error-hover disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-text-muted hover:text-text-main"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className="text-accent-error hover:text-accent-error-hover inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
