import React from 'react';
import { FileText } from 'lucide-react';
import { useAuditLogs } from '../../hooks/api/useAdmin';

const AuditLogs: React.FC = () => {
  const { data: logs, isLoading } = useAuditLogs();

  if (isLoading) {
    return <div className="text-text-muted">Loading audit logs...</div>;
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('delete')) return 'bg-accent-error bg-opacity-20 text-accent-error';
    if (action.includes('create')) return 'bg-accent-success bg-opacity-20 text-accent-success';
    if (action.includes('grant') || action.includes('admin'))
      return 'bg-accent-warning bg-opacity-20 text-accent-warning';
    return 'bg-accent-info bg-opacity-20 text-accent-info';
  };

  return (
    <div className="bg-surface-base p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-text-main mb-6 flex items-center">
        <FileText className="w-6 h-6 mr-2" />
        Audit Logs
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-default">
          <thead className="bg-surface-hover">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Admin User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Target User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-base divide-y divide-border-default">
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-surface-hover">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  ID: {log.admin_user_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-main">
                  {log.target_user_id ? `ID: ${log.target_user_id}` : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">
                  {log.details || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs && logs.length === 0 && (
          <div className="text-center py-8 text-text-muted">No audit logs found</div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
