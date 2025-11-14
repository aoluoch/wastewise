import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
import { axiosInstance } from '../../api/axiosInstance';

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  county?: string;
  constituency?: string;
  createdAt: string;
  updatedAt: string;
  collectorApplicationStatus: string;
}

const CollectorApplications: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>(
    {}
  );
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Fetch pending applications
  const { data, isLoading, error } = useQuery({
    queryKey: ['collector-applications'],
    queryFn: async () => {
      const response = await axiosInstance.get('/admin/collector-applications');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const applications: Application[] = data?.data?.applications || [];

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosInstance.put(
        `/admin/collector-applications/${userId}/approve`
      );
      return response.data;
    },
    onSuccess: _data => {
      showToast({
        type: 'success',
        message: 'Application approved successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['collector-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to approve application';
      showToast({ type: 'error', message });
    },
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      const response = await axiosInstance.put(
        `/admin/collector-applications/${userId}/reject`,
        {
          reason,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      showToast({ type: 'success', message: 'Application rejected' });
      queryClient.invalidateQueries({ queryKey: ['collector-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowRejectModal(null);
      setRejectReason({});
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to reject application';
      showToast({ type: 'error', message });
    },
  });

  const handleApprove = (userId: string) => {
    if (
      window.confirm(
        'Are you sure you want to approve this application? The user will become a collector.'
      )
    ) {
      approveMutation.mutate(userId);
    }
  };

  const handleReject = (userId: string) => {
    setShowRejectModal(userId);
  };

  const confirmReject = (userId: string) => {
    rejectMutation.mutate({
      userId,
      reason: rejectReason[userId] || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-gray-600 dark:text-gray-300'>
          Loading applications...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-red-600'>Error loading applications</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Poppins']">
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
          Collector Applications
        </h1>
        <p className='text-gray-600 dark:text-gray-300'>
          Review and manage applications from residents who want to become
          collectors
        </p>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
            {applications.length}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-300'>
            Pending Applications
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
        {applications.length === 0 ? (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
              No pending applications
            </h3>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              There are currently no pending collector applications to review.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-900'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Applicant
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Contact
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Location
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Applied On
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                {applications.map(application => (
                  <tr
                    key={application._id}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900 dark:text-white'>
                        {application.firstName} {application.lastName}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900 dark:text-white'>
                        {application.email}
                      </div>
                      {application.phone && (
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          {application.phone}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {application.county || application.constituency ? (
                        <div className='text-sm'>
                          {application.county && (
                            <div className='text-gray-900 dark:text-white'>
                              {application.county}
                            </div>
                          )}
                          {application.constituency && (
                            <div className='text-gray-500 dark:text-gray-400'>
                              {application.constituency}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400 dark:text-gray-500'>
                          Not specified
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {new Date(application.updatedAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <Button
                          onClick={() => handleApprove(application._id)}
                          disabled={approveMutation.isPending}
                          variant='primary'
                          className='!py-1 !px-3 text-xs'
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(application._id)}
                          disabled={rejectMutation.isPending}
                          variant='outline'
                          className='!py-1 !px-3 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20'
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Reject Application
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>
              Optionally provide a reason for rejecting this application. This
              will be sent to the applicant.
            </p>
            <textarea
              value={rejectReason[showRejectModal] || ''}
              onChange={e =>
                setRejectReason({
                  ...rejectReason,
                  [showRejectModal]: e.target.value,
                })
              }
              placeholder='Reason for rejection (optional)'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none'
              rows={4}
              maxLength={500}
            />
            <div className='flex justify-end space-x-3 mt-4'>
              <Button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason({});
                }}
                variant='outline'
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmReject(showRejectModal)}
                disabled={rejectMutation.isPending}
                className='bg-red-600 hover:bg-red-700 text-white'
              >
                {rejectMutation.isPending
                  ? 'Rejecting...'
                  : 'Reject Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorApplications;
