import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pickupApi } from '../../api/pickupApi';
import { useFetch, useMutation } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../context/ToastContext';
import { PickupStatus } from '../../types';

// Socket event types
interface TaskAssignmentData {
  collectorId: string;
  report?: { type: string };
  pickupTask?: { report?: { type: string } };
}

interface TaskUpdateData {
  status?: string;
  message?: string;
}

interface SystemNotificationData {
  message: string;
}

const CollectorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<PickupStatus | 'all'>(
    'all'
  );
  const [notifications, setNotifications] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Create stable function references to prevent infinite re-renders
  const fetchTasks = useCallback(() => pickupApi.getMyTasks(1, 50), []);
  const fetchStats = useCallback(() => pickupApi.getCollectorStats(), []);

  // Fetch collector's tasks
  const {
    data: tasksData,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useFetch(fetchTasks, { immediate: true });

  // Fetch collector statistics
  const { data: statsData, refetch: refetchStats } = useFetch(fetchStats, {
    immediate: true,
  });

  // Create stable mutation functions
  const startTaskFn = useCallback(
    (taskId: string) => pickupApi.startTask(taskId),
    []
  );
  const completeTaskFn = useCallback(
    ({ taskId, notes }: { taskId: string; notes?: string }) =>
      pickupApi.completeTask(taskId, notes),
    []
  );

  // Mutations for task actions
  const startTaskMutation = useMutation(startTaskFn, {
    onSuccess: () => {
      refetchTasks();
      refetchStats();
      showToast({
        type: 'success',
        title: 'Task Started',
        message: 'Task has been started successfully',
      });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to start task',
      });
    },
  });

  const completeTaskMutation = useMutation(completeTaskFn, {
    onSuccess: () => {
      refetchTasks();
      refetchStats();
      showToast({
        type: 'success',
        title: 'Task Completed',
        message: 'Task has been completed successfully',
      });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to complete task',
      });
    },
  });

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket && user && isConnected) {
      // Listen for new task assignments
      const handleNewTask = (data: TaskAssignmentData) => {
        if (data.collectorId === user.id || data.collectorId === user._id) {
          const taskType =
            data.report?.type || data.pickupTask?.report?.type || 'Task';
          setNotifications(prev => [...prev, `New task assigned: ${taskType}`]);
          showToast({
            type: 'info',
            title: 'New Task',
            message: `You have been assigned a new ${taskType} task`,
          });
          refetchTasks();
          refetchStats();
        }
      };

      // Listen for task updates
      const handleTaskUpdate = (data: TaskUpdateData) => {
        refetchTasks();
        refetchStats();
        if (data.status) {
          setNotifications(prev => [
            ...prev,
            `Task status updated: ${data.status}`,
          ]);
        }
      };

      // Listen for emergency alerts
      const handleEmergencyAlert = (data: SystemNotificationData) => {
        showToast({
          type: 'error',
          title: 'Emergency Alert',
          message: data.message,
        });
        setNotifications(prev => [...prev, `Emergency: ${data.message}`]);
      };

      // Listen for system notifications
      const handleSystemNotification = (data: SystemNotificationData) => {
        showToast({
          type: 'info',
          title: 'System Update',
          message: data.message,
        });
        setNotifications(prev => [...prev, data.message]);
      };

      socket.on('assign_task', handleNewTask);
      socket.on('task_update', handleTaskUpdate);
      socket.on('emergency_alert', handleEmergencyAlert);
      socket.on('system_notification', handleSystemNotification);

      return () => {
        socket.off('assign_task', handleNewTask);
        socket.off('task_update', handleTaskUpdate);
        socket.off('emergency_alert', handleEmergencyAlert);
        socket.off('system_notification', handleSystemNotification);
      };
    }
  }, [socket, user, isConnected, refetchTasks, refetchStats, showToast]);

  const tasks = tasksData?.data || [];
  const filteredTasks =
    selectedStatus === 'all'
      ? tasks
      : tasks.filter(task => task.status === selectedStatus);

  // Handle empty states gracefully
  const hasAnyTasks = tasks.length > 0;

  // Get today's tasks
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
    return (
      taskDate === today &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
    );
  });

  // Use API stats if available, otherwise calculate from tasks
  const stats = {
    total: statsData?.total || tasks.length,
    scheduled:
      statsData?.scheduled ||
      tasks.filter(task => task.status === 'scheduled').length,
    inProgress:
      statsData?.inProgress ||
      tasks.filter(task => task.status === 'in_progress').length,
    completed:
      statsData?.completed ||
      tasks.filter(task => task.status === 'completed').length,
    cancelled:
      statsData?.cancelled ||
      tasks.filter(task => task.status === 'cancelled').length,
    today: statsData?.today?.total || todayTasks.length,
    completionRate: statsData?.completionRate || 0,
  };

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTasks(), refetchStats()]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleStartTask = async (taskId: string) => {
    await startTaskMutation.mutate(taskId);
  };

  const handleCompleteTask = async (taskId: string) => {
    const notes = window.prompt('Add completion notes (optional):');
    if (notes !== null) {
      // Only proceed if user didn't cancel
      await completeTaskMutation.mutate({ taskId, notes: notes || undefined });
    }
  };

  const handleViewTask = (taskId: string) => {
    navigate(`/collector/tasks/${taskId}`);
  };

  if (tasksLoading && !tasksData) {
    return (
      <div className='space-y-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4'></div>
            <div className='space-y-3'>
              <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-full'></div>
              <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4'></div>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'
            >
              <div className='animate-pulse'>
                <div className='h-16 bg-gray-300 dark:bg-gray-600 rounded mb-4'></div>
                <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasksError && !tasksData) {
    return (
      <div className='space-y-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <div className='text-center text-red-600 dark:text-red-400 py-8'>
            <span className='text-4xl mb-4 block'>⚠️</span>
            <p>Error loading tasks: {tasksError.message}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
            >
              {refreshing ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <span className='text-blue-600 dark:text-blue-400'>🔔</span>
              <span className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                {notifications[notifications.length - 1]}
              </span>
            </div>
            <button
              onClick={() => setNotifications([])}
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200'
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center space-x-3 mb-2'>
              <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
                Welcome back, {user?.firstName}! 🚛
              </h1>
              <div className='flex items-center space-x-2'>
                <div
                  className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <p className='text-gray-600 dark:text-gray-400'>
              Here's your pickup schedule and task overview
            </p>
          </div>
          <div className='flex items-center space-x-3'>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center space-x-2'
            >
              <span>{refreshing ? '🔄' : '🔄'}</span>
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => navigate('/collector/route-optimization')}
              className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2'
            >
              <span>🗺️</span>
              <span>Optimize Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Tasks Highlight */}
      {todayTasks.length > 0 ? (
        <div className='bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold mb-2'>📅 Today's Tasks</h2>
              <p className='text-blue-100 mb-4'>
                You have {todayTasks.length} task
                {todayTasks.length !== 1 ? 's' : ''} scheduled for today
              </p>
              <div className='flex space-x-4 text-sm'>
                <span>
                  ⏱️{' '}
                  {todayTasks.reduce(
                    (total, task) => total + task.estimatedDuration,
                    0
                  )}{' '}
                  min total
                </span>
                <span>
                  🔥{' '}
                  {todayTasks.filter(t => t.report?.priority === 'high').length}{' '}
                  high priority
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/collector/route-optimization')}
              className='bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors'
            >
              View Route
            </button>
          </div>
        </div>
      ) : hasAnyTasks ? (
        <div className='bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg shadow p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold mb-2'>📅 Today's Tasks</h2>
              <p className='text-gray-100 mb-4'>
                No tasks scheduled for today. Great job staying on top of your
                work! 🎉
              </p>
            </div>
            <button
              onClick={() => navigate('/collector/route-optimization')}
              className='bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors'
            >
              View All Tasks
            </button>
          </div>
        </div>
      ) : (
        <div className='bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg shadow p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold mb-2'>📅 Welcome!</h2>
              <p className='text-gray-100 mb-4'>
                No tasks assigned yet. Check back later or contact your
                supervisor if you're expecting assignments.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className='bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors disabled:opacity-50'
            >
              {refreshing ? 'Checking...' : 'Check for Tasks'}
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-5 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center min-w-0'>
              <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0'>
                <span className='text-2xl'>📋</span>
              </div>
              <div className='ml-3 sm:ml-4 min-w-0'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Total Tasks
                </p>
                <p className='text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap'>
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-5 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center min-w-0'>
              <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0'>
                <span className='text-2xl'>📅</span>
              </div>
              <div className='ml-3 sm:ml-4 min-w-0'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Scheduled
                </p>
                <p className='text-3xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap'>
                  {stats.scheduled}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-5 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center min-w-0'>
              <div className='p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg shrink-0'>
                <span className='text-2xl'>🚛</span>
              </div>
              <div className='ml-3 sm:ml-4 min-w-0'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  In Progress
                </p>
                <p className='text-3xl font-bold text-yellow-600 dark:text-yellow-400 whitespace-nowrap'>
                  {stats.inProgress}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-5 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center min-w-0'>
              <div className='p-2 bg-green-100 dark:bg-green-900 rounded-lg shrink-0'>
                <span className='text-2xl'>✅</span>
              </div>
              <div className='ml-3 sm:ml-4 min-w-0'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Completed
                </p>
                <p className='text-3xl font-bold text-green-600 dark:text-green-400 whitespace-nowrap'>
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-5 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center min-w-0'>
              <div className='p-2 bg-red-100 dark:bg-red-900 rounded-lg shrink-0'>
                <span className='text-2xl'>❌</span>
              </div>
              <div className='ml-3 sm:ml-4 min-w-0'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Cancelled
                </p>
                <p className='text-3xl font-bold text-red-600 dark:text-red-400 whitespace-nowrap'>
                  {stats.cancelled}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-5 lg:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center min-w-0'>
              <div className='p-2 bg-purple-100 dark:bg-purple-900 rounded-lg shrink-0'>
                <span className='text-2xl'>📊</span>
              </div>
              <div className='ml-3 sm:ml-4 min-w-0'>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Completion Rate
                </p>
                <p className='text-3xl font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap'>
                  {stats.completionRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
        <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0'>
              My Tasks
            </h2>
            <div className='flex space-x-2'>
              <select
                value={selectedStatus}
                onChange={e =>
                  setSelectedStatus(e.target.value as PickupStatus | 'all')
                }
                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value='all'>All Tasks</option>
                <option value='scheduled'>Scheduled</option>
                <option value='in_progress'>In Progress</option>
                <option value='completed'>Completed</option>
                <option value='cancelled'>Cancelled</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2'
              >
                <span>{refreshing ? '🔄' : '🔄'}</span>
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {filteredTasks.length === 0 ? (
            <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
              <span className='text-6xl mb-4 block'>
                {!hasAnyTasks ? '🎯' : selectedStatus === 'all' ? '📭' : '🔍'}
              </span>
              <h3 className='text-lg font-medium mb-2 text-gray-700 dark:text-gray-300'>
                {!hasAnyTasks
                  ? 'Ready for Action!'
                  : selectedStatus === 'all'
                    ? 'All Caught Up!'
                    : 'No Matching Tasks'}
              </h3>
              <p className='text-sm mb-4'>
                {!hasAnyTasks
                  ? 'No tasks have been assigned to you yet. New assignments will appear here when available.'
                  : selectedStatus === 'all'
                    ? 'You have no tasks at the moment. Great work staying on top of everything!'
                    : `No tasks found with status "${selectedStatus.replace('_', ' ')}". Try selecting a different filter.`}
              </p>
              {!hasAnyTasks && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  {refreshing ? 'Checking...' : 'Check for New Tasks'}
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className='p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span
                        className={`text-sm font-medium ${getPriorityColor(task.report?.priority || 'medium')}`}
                      >
                        {(task.report?.priority || 'medium').toUpperCase()}{' '}
                        PRIORITY
                      </span>
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-1'>
                      {task.report?.type || 'Unknown Type'} -{' '}
                      {task.report?.description || 'No description'}
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                      📍{' '}
                      {task.report?.location?.address || 'No address provided'}
                    </p>
                    <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                      <span>
                        📅 {new Date(task.scheduledDate).toLocaleDateString()}
                      </span>
                      <span>⏱️ {task.estimatedDuration} min</span>
                      <span>📦 {task.report?.estimatedVolume || 0} kg</span>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2 ml-4'>
                    <button
                      onClick={() => handleViewTask(task.id)}
                      className='px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors'
                    >
                      View Details
                    </button>
                    {task.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        disabled={startTaskMutation.loading}
                        className='px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors'
                      >
                        {startTaskMutation.loading
                          ? 'Starting...'
                          : 'Start Task'}
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={completeTaskMutation.loading}
                        className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors'
                      >
                        {completeTaskMutation.loading
                          ? 'Completing...'
                          : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboard;
