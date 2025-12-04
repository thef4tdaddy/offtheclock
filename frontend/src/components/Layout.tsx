import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Calendar, 
  Clock, 
  Settings, 
  LogOut, 
  Menu,
  TrendingUp
} from 'lucide-react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();

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
          <a href="/history" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
            <Clock size={20} />
            <span className="font-medium">History</span>
          </a>
          <a href="/projections" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors">
            <TrendingUp size={20} />
            <span className="font-medium">Projections</span>
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
        <Header />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pt-20 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
