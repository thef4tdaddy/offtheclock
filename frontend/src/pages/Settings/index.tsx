import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import ProfileSection from './ProfileSection';
import AmazonPresetSection from './AmazonPresetSection';
import PTOSection from './PTOSection';
import { useUser } from '../../hooks/api/useUser';

const Settings: React.FC = () => {
  const { data: user } = useUser();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">Settings</h1>
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 bg-accent-warning text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            <Shield className="w-5 h-5 mr-2" />
            Admin Panel
          </Link>
        )}
      </div>

      <ProfileSection />
      <AmazonPresetSection />
      <PTOSection />
    </div>
  );
};

export default Settings;
