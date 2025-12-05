import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-bg-light font-sans overflow-hidden">
      {/* Sidebar */}
      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-dark-blue text-white flex flex-col h-full shrink-0 hidden md:flex transition-all duration-300 ease-in-out`}
      >
        <div className="p-6 flex items-center justify-center h-20">
          <img
            src={
              isCollapsed ? '/images/logo-icon-only.svg' : '/images/OffTheClock-Logo-With-Text.svg'
            }
            alt="OffTheClock"
            className={`${isCollapsed ? 'h-8' : 'h-12'} w-auto transition-all`}
          />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {[
            { href: '/', icon: Home, label: 'Home' },
            { href: '/calendar', icon: Calendar, label: 'Calendar' },
            { href: '/history', icon: Clock, label: 'History' },
            { href: '/projections', icon: TrendingUp, label: 'Projections' },
            { href: '/settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                window.location.pathname === item.href
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 hover:text-red-300 rounded-lg w-full transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-dark-blue text-white z-20 flex items-center justify-between p-4 shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="/images/OffTheClock-Logo-With-Text.svg"
            alt="OffTheClock"
            className="h-8 w-auto"
          />
        </div>
        <button
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-dark-blue/95 backdrop-blur-sm z-50 md:hidden flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <img
                src="/images/OffTheClock-Logo-With-Text.svg"
                alt="OffTheClock"
                className="h-8 w-auto"
              />
            </div>
            <button
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
            <a
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl text-lg"
            >
              <Home size={24} />
              <span className="font-medium">Home</span>
            </a>
            <a
              href="/calendar"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl text-lg"
            >
              <Calendar size={24} />
              <span className="font-medium">Calendar</span>
            </a>
            <a
              href="/history"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl text-lg"
            >
              <Clock size={24} />
              <span className="font-medium">History</span>
            </a>
            <a
              href="/projections"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl text-lg"
            >
              <TrendingUp size={24} />
              <span className="font-medium">Projections</span>
            </a>
            <a
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl text-lg"
            >
              <Settings size={24} />
              <span className="font-medium">Settings</span>
            </a>

            <div className="pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 hover:text-red-300 rounded-xl w-full text-lg"
              >
                <LogOut size={24} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Fixed Header */}
        <Header />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
