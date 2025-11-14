import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const ResidentLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const location = useLocation();

  const residentNavItems = [
    { name: 'Dashboard', href: '/resident/dashboard', icon: '🏠' },
    { name: 'Report Waste', href: '/resident/report', icon: '📝' },
    { name: 'My Statistics', href: '/resident/statistics', icon: '📊' },
    { name: 'Community Feed', href: '/reports', icon: '📰' },
    { name: 'Schedule', href: '/resident/schedule', icon: '📅' },
    { name: 'Notifications', href: '/resident/notifications', icon: '🔔' },
  ];

  return (
    <div
      className={`min-h-screen ${actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} scroll-smooth`}
    >
      {/* Sticky Navbar */}
      <div className='sticky top-0 z-30'>
        <Navbar
          user={user}
          onLogout={logout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>

      <div className='flex'>
        {/* Fixed Sidebar space (desktop) */}
        <div className='hidden lg:block lg:w-64 lg:flex-shrink-0'></div>
        <div className='hidden lg:block'>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navItems={residentNavItems}
            currentPath={location.pathname}
          />
        </div>

        {/* Mobile Sidebar */}
        <div className='lg:hidden'>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navItems={residentNavItems}
            currentPath={location.pathname}
          />
        </div>

        {/* Main Content */}
        <main className='flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto'>
          <div className='px-6 py-6 max-w-7xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResidentLayout;
