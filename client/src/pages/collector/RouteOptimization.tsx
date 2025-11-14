import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pickupApi } from '../../api/pickupApi';
import { useFetch } from '../../hooks/useFetch';
import { PickupTask } from '../../types';

const RouteOptimization: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [optimizedRoute, setOptimizedRoute] = useState<PickupTask[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Fetch tasks for selected date
  const { data: tasksData } = useFetch(() => pickupApi.getMyTasks(1, 50), {
    immediate: true,
  });

  const tasks = tasksData?.data || [];
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
    return (
      taskDate === selectedDate &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
    );
  });

  const optimizeRoute = async () => {
    if (todayTasks.length === 0) return;

    setIsOptimizing(true);
    try {
      // Simple optimization algorithm - sort by priority and proximity
      const optimized = [...todayTasks].sort((a, b) => {
        // First sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = a.report?.priority || 'medium';
        const bPriority = b.report?.priority || 'medium';
        const priorityDiff =
          priorityOrder[bPriority as keyof typeof priorityOrder] -
          priorityOrder[aPriority as keyof typeof priorityOrder];

        if (priorityDiff !== 0) return priorityDiff;

        // Then by estimated duration (shorter tasks first)
        return a.estimatedDuration - b.estimatedDuration;
      });

      setOptimizedRoute(optimized);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getTotalDuration = (taskList: PickupTask[]) => {
    return taskList.reduce((total, task) => total + task.estimatedDuration, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <div className='flex items-center justify-between mb-4'>
          <button
            onClick={() => navigate('/collector/dashboard')}
            className='flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          >
            <span className='mr-2'>←</span>
            Back to Dashboard
          </button>
        </div>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
          Route Optimization 🗺️
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>
          Optimize your pickup route for maximum efficiency
        </p>
      </div>

      {/* Date Selection */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <div className='flex items-center space-x-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Select Date
            </label>
            <input
              type='date'
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            />
          </div>
          <div className='flex-1'>
            <div className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
              Tasks for {new Date(selectedDate).toLocaleDateString()}
            </div>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {todayTasks.length} tasks ({getTotalDuration(todayTasks)} min)
            </div>
          </div>
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing || todayTasks.length === 0}
            className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors'
          >
            {isOptimizing ? 'Optimizing...' : '🎯 Optimize Route'}
          </button>
        </div>
      </div>

      {/* Route Display */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Original Order */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Original Order
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Tasks in scheduled order
            </p>
          </div>
          <div className='divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto'>
            {todayTasks.length === 0 ? (
              <div className='p-6 text-center text-gray-500 dark:text-gray-400'>
                <span className='text-4xl mb-4 block'>📅</span>
                <p>No tasks scheduled for this date</p>
              </div>
            ) : (
              todayTasks.map((task, index) => (
                <div key={task.id} className='p-4'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <div className='w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium'>
                      {index + 1}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-sm font-medium ${getPriorityColor(task.report?.priority || 'medium')}`}
                    >
                      {(task.report?.priority || 'medium').toUpperCase()}
                    </span>
                  </div>
                  <h3 className='font-medium text-gray-900 dark:text-white mb-1'>
                    {task.report?.type || 'Unknown Type'}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                    📍 {task.report?.location?.address || 'No address provided'}
                  </p>
                  <div className='flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400'>
                    <span>⏱️ {task.estimatedDuration} min</span>
                    <span>📦 {task.report?.estimatedVolume || 0} kg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Optimized Order */}
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
          <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Optimized Route
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Optimized for priority and efficiency
            </p>
          </div>
          <div className='divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto'>
            {optimizedRoute.length === 0 ? (
              <div className='p-6 text-center text-gray-500 dark:text-gray-400'>
                <span className='text-4xl mb-4 block'>🎯</span>
                <p>Click "Optimize Route" to see the optimized order</p>
              </div>
            ) : (
              optimizedRoute.map((task, index) => (
                <div key={task.id} className='p-4'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium'>
                      {index + 1}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                    >
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span
                      className={`text-sm font-medium ${getPriorityColor(task.report?.priority || 'medium')}`}
                    >
                      {(task.report?.priority || 'medium').toUpperCase()}
                    </span>
                  </div>
                  <h3 className='font-medium text-gray-900 dark:text-white mb-1'>
                    {task.report.type}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                    📍 {task.report.location.address}
                  </p>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400'>
                      <span>⏱️ {task.estimatedDuration} min</span>
                      <span>📦 {task.report.estimatedVolume} kg</span>
                    </div>
                    <button
                      onClick={() => navigate(`/collector/tasks/${task.id}`)}
                      className='text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors'
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Route Summary */}
      {optimizedRoute.length > 0 && (
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Route Summary
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {optimizedRoute.length}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Total Tasks
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {getTotalDuration(optimizedRoute)}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Total Minutes
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600 dark:text-red-400'>
                {
                  optimizedRoute.filter(t => t.report?.priority === 'high')
                    .length
                }
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                High Priority
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                {Math.round((getTotalDuration(optimizedRoute) / 60) * 10) / 10}h
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Estimated Hours
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimization;
