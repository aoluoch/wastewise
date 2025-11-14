import React from 'react';
import { Link } from 'react-router-dom';
import { User, Theme } from '../types';
import Button from './Button';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onToggleSidebar,
  theme,
  onThemeChange,
}) => {
  const handleThemeToggle = () => {
    const newTheme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    onThemeChange(newTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '☀️';
    }
  };

  return (
    <nav className='bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Left side */}
          <div className='flex items-center'>
            {/* Mobile menu button */}
            <button
              onClick={onToggleSidebar}
              className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>

            {/* Logo */}
            <Link to='/' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-lg'>W</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-['Poppins']">
                WasteWise
              </span>
            </Link>
          </div>

          {/* Right side */}
          <div className='flex items-center space-x-4'>
            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className='p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
              title={`Current theme: ${theme}`}
            >
              <span className='text-lg'>{getThemeIcon()}</span>
            </button>

            {/* User menu */}
            {user ? (
              <div className='flex items-center space-x-3'>
                <div className='hidden sm:block text-right'>
                  <p className="text-sm font-medium text-gray-900 dark:text-white font-['Poppins']">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-['Poppins']">
                    {user.role}
                  </p>
                </div>

                <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                  <span className='text-white font-medium text-sm'>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                </div>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={onLogout}
                  className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-2'>
                <Link to='/auth/login'>
                  <Button variant='ghost' size='sm'>
                    Login
                  </Button>
                </Link>
                <Link to='/auth/register'>
                  <Button variant='primary' size='sm'>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
