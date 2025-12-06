import React from 'react';
import { Shield } from 'lucide-react';
import UserManagement from './UserManagement';
import CreateUserForm from './CreateUserForm';
import SystemSettings from './SystemSettings';
import DatabaseMetrics from './DatabaseMetrics';
import AuditLogs from './AuditLogs';

const AdminPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-accent-warning" />
        <h1 className="text-3xl font-bold text-text-main">Admin Panel</h1>
      </div>

      <DatabaseMetrics />
      <SystemSettings />
      <CreateUserForm />
      <UserManagement />
      <AuditLogs />
    </div>
  );
};

export default AdminPage;
