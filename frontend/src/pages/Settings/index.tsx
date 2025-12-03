import React from 'react';
import ProfileSection from './ProfileSection';
import AmazonPresetSection from './AmazonPresetSection';
import PTOSection from './PTOSection';

const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-text-main">Settings</h1>
      
      <ProfileSection />
      <AmazonPresetSection />
      <PTOSection />
    </div>
  );
};

export default Settings;
