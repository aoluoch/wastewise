import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/formatters';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  navItems,
  currentPath,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className='fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:shadow-lg border-r border-gray-200 dark:border-gray-700',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex flex-col h-full flex-shrink-0'>
          {/* Navigation items */}
          <nav className='flex-1 px-6 py-6 space-y-3 overflow-y-auto'>
            {navItems.map(item => {
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] font-["Poppins"]',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <span className='mr-4 text-lg'>{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className='p-6 border-t border-gray-200 dark:border-gray-700'>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-['Poppins']">
              <p className='font-medium'>WasteWise v1.0.0</p>
              <p className='mt-1'>
                © {new Date().getFullYear()} All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
