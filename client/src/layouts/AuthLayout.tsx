import React from 'react';
import { Outlet } from 'react-router-dom';
const AuthLayout: React.FC = () => {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800`}
    >
      <div className='flex min-h-screen'>
        {/* Left Side - Branding */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden'>
          <div className='absolute inset-0 bg-black opacity-20'></div>
          <div className='relative z-10 flex flex-col justify-center items-center text-white p-12'>
            <div className='text-center'>
              <h1 className='text-5xl font-bold mb-4'>WasteWise</h1>
              <p className='text-xl opacity-90 mb-8'>
                Smart waste management for a cleaner tomorrow
              </p>
              <div className='space-y-4 text-left max-w-md'>
                <div className='flex items-center space-x-3'>
                  <div className='w-2 h-2 bg-white rounded-full'></div>
                  <span>Real-time waste tracking</span>
                </div>
                <div className='flex items-center space-x-3'>
                  <div className='w-2 h-2 bg-white rounded-full'></div>
                  <span>Efficient collection scheduling</span>
                </div>
                <div className='flex items-center space-x-3'>
                  <div className='w-2 h-2 bg-white rounded-full'></div>
                  <span>Community-driven solutions</span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className='absolute top-20 right-20 w-32 h-32 bg-white opacity-10 rounded-full'></div>
          <div className='absolute bottom-20 left-20 w-24 h-24 bg-white opacity-10 rounded-full'></div>
          <div className='absolute top-1/2 right-10 w-16 h-16 bg-white opacity-10 rounded-full'></div>
        </div>

        {/* Right Side - Auth Form */}
        <div className='flex-1 flex items-center justify-center p-8'>
          <div className='w-full max-w-md'>
            <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8'>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
