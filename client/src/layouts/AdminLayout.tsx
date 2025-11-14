import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const location = useLocation();

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Reports', href: '/admin/reports', icon: '📋' },
    { name: 'Task Assignment', href: '/admin/assignments', icon: '👷' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Applications', href: '/admin/applications', icon: '📝' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
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
            navItems={adminNavItems}
            currentPath={location.pathname}
          />
        </div>

        {/* Mobile Sidebar */}
        <div className='lg:hidden'>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navItems={adminNavItems}
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

export default AdminLayout;
