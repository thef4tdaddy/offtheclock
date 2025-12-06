import React from 'react';
import { Database, Users, Calendar, FileText } from 'lucide-react';
import { useAdminMetrics } from '../../hooks/api/useAdmin';

const DatabaseMetrics: React.FC = () => {
  const { data: metrics, isLoading } = useAdminMetrics();

  if (isLoading) {
    return <div className="text-text-muted">Loading metrics...</div>;
  }

  const metricItems = [
    {
      label: 'Total Users',
      value: metrics?.total_users || 0,
      icon: Users,
      color: 'text-accent-info',
    },
    {
      label: 'PTO Categories',
      value: metrics?.total_pto_categories || 0,
      icon: FileText,
      color: 'text-accent-success',
    },
    {
      label: 'Total Shifts',
      value: metrics?.total_shifts || 0,
      icon: Calendar,
      color: 'text-accent-warning',
    },
    {
      label: 'PTO Logs',
      value: metrics?.total_pto_logs || 0,
      icon: Database,
      color: 'text-accent-error',
    },
  ];

  return (
    <div className="bg-surface-base p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-text-main mb-6">Database Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-surface-hover p-4 rounded-md flex items-center space-x-4"
            >
              <div className={`${item.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{item.label}</p>
                <p className="text-2xl font-bold text-text-main">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DatabaseMetrics;
