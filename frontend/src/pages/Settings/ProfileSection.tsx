import React, { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import { useUserProfile, useUpdateProfileMutation } from '../../hooks/api/useUser';

const ProfileSection: React.FC = () => {
  const { data: profileData, isLoading } = useUserProfile();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfileMutation();

  // Initialize state only when data is first available or changes
  const [localProfile, setLocalProfile] = useState({ 
    full_name: '', 
    employer: '', 
    avatar_url: '' 
  });

  useEffect(() => {
    if (profileData) {
      setLocalProfile(prev => {
        // Only update if changes to avoid loop/overhead
        if (
          prev.full_name === profileData.full_name && 
          prev.employer === profileData.employer && 
          prev.avatar_url === profileData.avatar_url
        ) {
          return prev;
        }
        return {
          full_name: profileData.full_name || '',
          employer: profileData.employer || '',
          avatar_url: profileData.avatar_url || ''
        };
      });
    }
  }, [profileData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(localProfile, {
      onSuccess: () => {
        alert('Profile updated successfully!');
        window.location.reload(); // Simple reload to refresh header context
      },
      onError: () => alert('Failed to update profile')
    });
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6 text-text-main flex items-center gap-2">
        <User size={24} className="text-primary" />
        Profile Settings
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={localProfile.full_name}
              onChange={(e) => setLocalProfile({ ...localProfile, full_name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Employer</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={localProfile.employer}
              onChange={(e) => setLocalProfile({ ...localProfile, employer: e.target.value })}
              placeholder="e.g. Amazon"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1">Avatar URL</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={localProfile.avatar_url}
              onChange={(e) => setLocalProfile({ ...localProfile, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-text-muted mt-1">Enter a direct link to an image.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium shadow-lg shadow-cyan-100 transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSection;
