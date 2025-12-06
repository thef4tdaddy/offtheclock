import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useCreateUser } from '../../hooks/api/useAdmin';
import type { AdminUserCreate } from '../../domain/schemas/admin';

const CreateUserForm: React.FC = () => {
  const createUserMutation = useCreateUser();
  const [formData, setFormData] = useState<AdminUserCreate>({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({
          email: '',
          password: '',
          full_name: '',
          role: 'employee',
        });
        setShowForm(false);
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!showForm) {
    return (
      <div className="bg-surface-base p-6 rounded-lg shadow-md">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-accent-info text-white rounded-md hover:bg-accent-info-hover transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Create New User
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-base p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-text-main mb-6">Create New User</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-surface-hover border border-border-default rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-accent-info"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$"
            title="Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            className="w-full px-3 py-2 bg-surface-hover border border-border-default rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-accent-info"
          />
          <p className="text-xs text-text-secondary mt-1">
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </p>
        </div>

        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-surface-hover border border-border-default rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-accent-info"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-text-main mb-1"
          >
            Role *
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-surface-hover border border-border-default rounded-md text-text-main focus:outline-none focus:ring-2 focus:ring-accent-info"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className="px-4 py-2 bg-accent-info text-white rounded-md hover:bg-accent-info-hover transition-colors disabled:opacity-50"
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-surface-hover text-text-main rounded-md hover:bg-surface-active transition-colors"
          >
            Cancel
          </button>
        </div>

        {createUserMutation.isError && (
          <p className="text-accent-error text-sm">
            Error creating user. Please try again.
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateUserForm;
