import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const NotFound: React.FC = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='text-center'>
        <div className='text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4'>
          404
        </div>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
          Page Not Found
        </h1>
        <p className='text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto'>
          Sorry, we couldn't find the page you're looking for. It might have
          been moved, deleted, or doesn't exist.
        </p>
        <div className='space-x-4'>
          <Link to='/'>
            <Button variant='primary' size='lg'>
              Go Home
            </Button>
          </Link>
          <Button
            variant='outline'
            size='lg'
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
