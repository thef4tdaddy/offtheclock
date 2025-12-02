import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Calendar, 
  Clock, 
  Settings, 
  LogOut, 
  User,
  Bell,
  Menu
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-light font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-blue text-white flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-6 flex items-center justify-center">
          <img 
            src="/images/OffTheClock-Logo-With-Text.svg" 
            alt="OffTheClock" 
            className="h-12 w-auto"
          />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <a href="/" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg text-white">
            <Home size={20} />
            <span className="font-medium">Home</span>
          </a>
          <a href="/calendar" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
            <Calendar size={20} />
            <span className="font-medium">Calendar</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
            <Clock size={20} />
            <span className="font-medium">Requests</span>
          </a>
          <a href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </a>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 hover:text-red-300 rounded-lg w-full transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-dark-blue text-white z-20 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/images/OffTheClock-Logo-With-Text.svg" 
            alt="OffTheClock" 
            className="h-8 w-auto"
          />
        </div>
        <button className="p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Fixed Header */}
        <header className="flex justify-between items-center h-20 px-8 bg-dark-blue text-white shadow-md shrink-0 z-10">
          <div>
            <h1 className="text-xl font-bold">Welcome back, User</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-700 relative">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white">Don Monda</div>
                <div className="text-xs text-gray-400">Employee</div>
              </div>
              
              {/* Avatar Dropdown Trigger */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors focus:outline-none"
              >
                <User size={20} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
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

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pt-20 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
