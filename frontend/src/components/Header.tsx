import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Settings, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { token, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock data for now, derived from token or hardcoded
  // In a real app, we'd fetch this from the API using the new React Query setup!
  const userDetails = {
    username: token ? 'User' : 'Guest', // We could decode the token if it was a JWT, but for now just placeholder
    realName: 'Don Monda', // Mock data as requested
    employer: 'Acme Corp', // Mock data as requested
    avatarUrl: null, // Placeholder for avatar URL
  };

  // TODO: Implement Low UPT Warning (Issue #6)
  // Logic: Check if UPT category balance < 0 and display warning icon/banner
  
  return (
    <header className="flex justify-between items-center h-20 px-8 bg-dark-blue text-white shadow-md shrink-0 z-10">
      <div>
        <h1 className="text-xl font-bold">Welcome back, {userDetails.username}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700 relative">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-white">{userDetails.realName}</div>
            <div className="text-xs text-gray-400">{userDetails.employer}</div>
          </div>
          
          {/* Avatar Dropdown Trigger */}
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors focus:outline-none overflow-hidden"
          >
            {userDetails.avatarUrl ? (
              <img src={userDetails.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                <p className="text-sm font-semibold text-gray-900">{userDetails.realName}</p>
                <p className="text-xs text-gray-500">{userDetails.employer}</p>
              </div>
              <a href="/settings" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings size={16} />
                Settings
              </a>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
