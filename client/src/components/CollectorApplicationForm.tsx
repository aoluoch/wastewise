import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Button from './Button';
import { axiosInstance } from '../api/axiosInstance';
import { KENYAN_COUNTIES } from '../data/kenyanLocations';

const CollectorApplicationForm: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    county: user?.county || '',
    constituency: user?.constituency || '',
  });

  const selectedCounty = KENYAN_COUNTIES.find(c => c.name === formData.county);

  const applyForCollectorMutation = useMutation({
    mutationFn: async (data: { county: string; constituency: string }) => {
      const response = await axiosInstance.post(
        '/users/apply-for-collector',
        data
      );
      return response.data;
    },
    onSuccess: (_res, variables) => {
      showToast({
        type: 'success',
        message:
          'Application submitted successfully! Please wait for admin approval.',
      });
      // Optimistically update auth user state so UI reflects pending status immediately
      updateUser({
        collectorApplicationStatus: 'pending',
        county: variables?.county,
        constituency: variables?.constituency,
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setShowForm(false);
      setFormData({ county: '', constituency: '' });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to submit application';
      showToast({ type: 'error', message });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleApply = () => {
    if (!formData.county || !formData.constituency) {
      showToast({
        type: 'error',
        message: 'Please select both county and constituency',
      });
      return;
    }
    setIsSubmitting(true);
    applyForCollectorMutation.mutate(formData);
  };

  // Don't show if user is already a collector
  if (user?.role === 'collector') {
    return null;
  }

  // Application Form Modal should take precedence when open
  if (showForm) {
    return (
      <div className='fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700'>
          <div className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Collector Application
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    county: user?.county || '',
                    constituency: user?.constituency || '',
                  });
                }}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                ✕
              </button>
            </div>

            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
              Please provide your location information to help us assign
              collection tasks efficiently.
            </p>

            <div className='space-y-4'>
              {/* County Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  County *
                </label>
                <select
                  value={formData.county}
                  onChange={e =>
                    setFormData({ county: e.target.value, constituency: '' })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  required
                >
                  <option value=''>Select County...</option>
                  {KENYAN_COUNTIES.map(county => (
                    <option key={county.name} value={county.name}>
                      {county.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Constituency Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  Constituency *
                </label>
                <select
                  value={formData.constituency}
                  onChange={e =>
                    setFormData({ ...formData, constituency: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  disabled={!formData.county}
                  required
                >
                  <option value=''>Select Constituency...</option>
                  {selectedCounty?.constituencies.map(constituency => (
                    <option key={constituency} value={constituency}>
                      {constituency}
                    </option>
                  ))}
                </select>
                {!formData.county && (
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    Please select a county first
                  </p>
                )}
              </div>
            </div>

            <div className='flex space-x-3 mt-6'>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    county: user?.county || '',
                    constituency: user?.constituency || '',
                  });
                }}
                variant='outline'
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={
                  isSubmitting || !formData.county || !formData.constituency
                }
                variant='primary'
                className='flex-1'
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show different UI based on application status
  if (user?.collectorApplicationStatus === 'pending') {
    return (
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <svg
              className='h-6 w-6 text-blue-600 dark:text-blue-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <div className='ml-3 flex-1'>
            <h3 className='text-lg font-semibold text-blue-900 dark:text-blue-100'>
              Application Pending
            </h3>
            <p className='mt-2 text-sm text-blue-700 dark:text-blue-300'>
              Your application to become a collector is currently under review.
              We'll notify you once an admin has reviewed your application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.collectorApplicationStatus === 'rejected') {
    return (
      <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              Become a Waste Collector
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
              Your previous application was not approved. You can reapply to
              become a collector and help keep your community clean.
            </p>
            <Button onClick={() => setShowForm(true)} variant='primary'>
              Reapply Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show apply button for users who haven't applied
  if (
    user?.collectorApplicationStatus === 'none' ||
    !user?.collectorApplicationStatus
  ) {
    return (
      <div className='bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              Become a Waste Collector
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
              Join our team of collectors and help keep your community clean.
              Earn money while making a positive environmental impact.
            </p>
            <div className='space-y-2 mb-4'>
              <div className='flex items-center text-sm text-gray-700 dark:text-gray-300'>
                <svg
                  className='h-5 w-5 text-green-500 mr-2'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                Flexible working hours
              </div>
              <div className='flex items-center text-sm text-gray-700 dark:text-gray-300'>
                <svg
                  className='h-5 w-5 text-green-500 mr-2'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                Competitive compensation
              </div>
              <div className='flex items-center text-sm text-gray-700 dark:text-gray-300'>
                <svg
                  className='h-5 w-5 text-green-500 mr-2'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                Make a difference in your community
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} variant='primary'>
              Apply to Become a Collector
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // (Modal handled above)

  return null;
};

export default CollectorApplicationForm;
