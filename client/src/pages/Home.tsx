import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Hero Section */}
      <div className='relative overflow-hidden'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6'>
              Welcome to{' '}
              <span className='text-blue-600 dark:text-blue-400'>
                WasteWise
              </span>
            </h1>
            <p className='text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto'>
              Smart waste management for a cleaner tomorrow. Report waste,
              schedule pickups, and contribute to a sustainable community.
            </p>

            {isAuthenticated ? (
              <div className='space-y-4'>
                <p className='text-lg text-gray-700 dark:text-gray-300'>
                  Welcome back, {user?.firstName}!
                </p>
                <Link to={`/${user?.role}/dashboard`}>
                  <Button size='lg' className='text-lg px-8 py-4'>
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className='space-x-4'>
                <Link to='/auth/login'>
                  <Button
                    variant='primary'
                    size='lg'
                    className='text-lg px-8 py-4'
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to='/auth/register'>
                  <Button
                    variant='outline'
                    size='lg'
                    className='text-lg px-8 py-4'
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className='py-24 bg-white dark:bg-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
              Why Choose WasteWise?
            </h2>
            <p className='text-lg text-gray-600 dark:text-gray-300'>
              We make waste management simple, efficient, and community-driven
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            <div className='text-center p-6'>
              <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>📱</span>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                Easy Reporting
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                Report waste issues quickly with photos and location details
              </p>
            </div>

            <div className='text-center p-6'>
              <div className='w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🚛</span>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                Smart Scheduling
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                Automated pickup scheduling based on location and priority
              </p>
            </div>

            <div className='text-center p-6'>
              <div className='w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>📊</span>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                Real-time Tracking
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                Track your reports and pickup status in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className='py-24 bg-blue-600 dark:bg-blue-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-3xl font-bold text-white mb-4'>
              Ready to Make a Difference?
            </h2>
            <p className='text-xl text-blue-100 mb-8'>
              Join thousands of residents working together for a cleaner
              community
            </p>
            <Link to='/auth/register'>
              <Button
                variant='secondary'
                size='lg'
                className='text-lg px-8 py-4'
              >
                Start Today
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
