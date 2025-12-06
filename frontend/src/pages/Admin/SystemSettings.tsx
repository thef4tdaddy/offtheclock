import React from 'react';
import { useAdminSettings, useUpdateSetting } from '../../hooks/api/useAdmin';

const SystemSettings: React.FC = () => {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettingMutation = useUpdateSetting();

  const registrationEnabled =
    settings?.find((s) => s.key === 'registration_enabled')?.value === 'true';

  const handleToggleRegistration = () => {
    const newValue = registrationEnabled ? 'false' : 'true';
    updateSettingMutation.mutate({
      key: 'registration_enabled',
      value: newValue,
    });
  };

  if (isLoading) {
    return <div className="text-text-muted">Loading settings...</div>;
  }

  return (
    <div className="bg-surface-base p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-text-main mb-6">System Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-hover rounded-md">
          <div>
            <h3 className="text-lg font-medium text-text-main">User Registration</h3>
            <p className="text-sm text-text-muted">
              {registrationEnabled
                ? 'New users can register for accounts'
                : 'New user registration is disabled'}
            </p>
          </div>
          <button
            onClick={handleToggleRegistration}
            disabled={updateSettingMutation.isPending}
            role="switch"
            aria-checked={registrationEnabled}
            aria-label="Toggle user registration"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              registrationEnabled ? 'bg-accent-success' : 'bg-surface-active'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                registrationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
