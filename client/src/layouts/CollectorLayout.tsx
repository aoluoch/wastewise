import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const CollectorLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const location = useLocation();

  const collectorNavItems = [
    { name: 'Dashboard', href: '/collector/dashboard', icon: '📊' },
    { name: 'My Tasks', href: '/collector/dashboard', icon: '📋' },
    {
      name: 'Route Optimization',
      href: '/collector/route-optimization',
      icon: '🗺️',
    },
    { name: 'Performance', href: '/collector/performance', icon: '📈' },
    { name: 'Chat', href: '/collector/chat', icon: '💬' },
    { name: 'Area Chat', href: '/collector/area-chat', icon: '📍' },
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
        {/* Sticky Sidebar */}
        <div className='hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:z-20'>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navItems={collectorNavItems}
            currentPath={location.pathname}
          />
        </div>

        {/* Mobile Sidebar */}
        <div className='lg:hidden'>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navItems={collectorNavItems}
            currentPath={location.pathname}
          />
        </div>

        {/* Main Content */}
        <main className='flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] overflow-y-auto'>
          <div className='p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollectorLayout;
