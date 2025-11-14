import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notificationApi';
import { Notification, NotificationFilters } from '../../types';
import Button from '../../components/Button';
import { useSocket } from '../../hooks/useSocket';

const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', filters, page],
    queryFn: () => notificationApi.getNotifications(filters, page, limit),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isConnected, queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAllMutation.mutate();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_created':
        return '📝';
      case 'report_assigned':
        return '👷';
      case 'report_completed':
        return '✅';
      case 'pickup_scheduled':
        return '📅';
      case 'pickup_reminder':
        return '⏰';
      case 'system_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;
  const pagination = data?.pagination;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
              Notifications
            </h1>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          <div className='flex gap-2'>
            {unreadCount > 0 && (
              <Button
                variant='outline'
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant='outline'
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className='mt-4 flex flex-wrap gap-2'>
          <button
            onClick={() => setFilters({})}
            className={`px-3 py-1 rounded-full text-sm ${
              !filters.isRead && !filters.type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilters({ isRead: false })}
            className={`px-3 py-1 rounded-full text-sm ${
              filters.isRead === false
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilters({ isRead: true })}
            className={`px-3 py-1 rounded-full text-sm ${
              filters.isRead === true
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-gray-500'>Loading notifications...</div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-red-500'>Error loading notifications</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className='text-center text-gray-500 dark:text-gray-400 py-12'>
            <span className='text-4xl mb-4 block'>🔔</span>
            <p className='text-lg font-medium'>No notifications</p>
            <p className='text-sm mt-2'>
              {filters.isRead === false
                ? 'You have no unread notifications'
                : filters.isRead === true
                  ? 'You have no read notifications'
                  : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200 dark:divide-gray-700'>
            {notifications.map((notification: Notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className='flex items-start gap-4'>
                  <div className='text-3xl flex-shrink-0'>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className='w-2 h-2 bg-blue-600 rounded-full'></span>
                          )}
                        </div>
                        <p className='text-sm text-gray-600 dark:text-gray-300 mb-2'>
                          {notification.message}
                        </p>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </span>
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className='flex gap-2 flex-shrink-0'>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className='text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm'
                            title='Mark as read'
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification._id)}
                          className='text-red-600 hover:text-red-800 dark:text-red-400 text-sm'
                          title='Delete'
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600 dark:text-gray-300'>
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
