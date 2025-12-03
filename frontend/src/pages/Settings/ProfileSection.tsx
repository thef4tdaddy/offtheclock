import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Save } from 'lucide-react';

interface UserProfile {
  email: string;
  full_name?: string;
  employer?: string;
  avatar_url?: string;
}

const ProfileSection: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/users/me');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/auth/users/me', {
        full_name: profile.full_name,
        employer: profile.employer,
        avatar_url: profile.avatar_url
      });
      alert('Profile updated successfully!');
      // Force a reload to update the header (simple solution for now)
      window.location.reload(); 
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;

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
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Employer</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={profile.employer || ''}
              onChange={(e) => setProfile({ ...profile, employer: e.target.value })}
              placeholder="e.g. Amazon"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-1">Avatar URL</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={profile.avatar_url || ''}
              onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
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
