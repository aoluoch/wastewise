import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Button from './Button';
import { axiosInstance } from '../api/axiosInstance';

const CollectorApplicationForm: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyForCollectorMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post('/users/apply-for-collector');
      return response.data;
    },
    onSuccess: () => {
      showToast({ type: 'success', message: 'Application submitted successfully! Please wait for admin approval.' });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to submit application';
      showToast({ type: 'error', message });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleApply = () => {
    setIsSubmitting(true);
    applyForCollectorMutation.mutate();
  };

  // Don't show if user is already a collector
  if (user?.role === 'collector') {
    return null;
  }

  // Show different UI based on application status
  if (user?.collectorApplicationStatus === 'pending') {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Application Pending
            </h3>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              Your application to become a collector is currently under review. We'll notify you once an admin has reviewed your application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user?.collectorApplicationStatus === 'rejected') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Become a Waste Collector
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Your previous application was not approved. You can reapply to become a collector and help keep your community clean.
            </p>
            <Button
              onClick={handleApply}
              disabled={isSubmitting}
              variant="primary"
            >
              {isSubmitting ? 'Submitting...' : 'Reapply Now'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Show apply button for users who haven't applied
  if (user?.collectorApplicationStatus === 'none' || !user?.collectorApplicationStatus) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Become a Waste Collector
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Join our team of collectors and help keep your community clean. Earn money while making a positive environmental impact.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Flexible working hours
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Competitive compensation
              </div>
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Make a difference in your community
              </div>
            </div>
            <Button
              onClick={handleApply}
              disabled={isSubmitting}
              variant="primary"
            >
              {isSubmitting ? 'Submitting...' : 'Apply to Become a Collector'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CollectorApplicationForm;
