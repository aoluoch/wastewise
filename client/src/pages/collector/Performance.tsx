import React, { useState, useEffect, useCallback } from 'react';
import { pickupApi } from '../../api/pickupApi';

interface PerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  tasksByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  weeklyData: Array<{
    week: string;
    tasksCompleted: number;
    averageTime: number;
  }>;
  efficiency: {
    onTimeCompletions: number;
    totalCompletions: number;
    onTimeRate: number;
  };
}

const Performance: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'year'
  >('month');

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pickupApi.getCollectorPerformance(selectedPeriod);
      setMetrics(data);
    } catch {
      setError('Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/4 mb-6'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='bg-white p-6 rounded-lg shadow'>
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
            <div className='text-red-600 text-lg font-medium mb-2'>
              ⚠️ Error Loading Performance Data
            </div>
            <p className='text-red-600 mb-4'>{error}</p>
            <button
              onClick={fetchPerformanceData}
              className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-6 text-center'>
            <div className='text-gray-600 text-lg font-medium mb-2'>
              📊 No Performance Data
            </div>
            <p className='text-gray-600'>
              No performance data available for the selected period.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            📈 Performance Analytics
          </h1>
          <div className='flex space-x-2'>
            {(['week', 'month', 'year'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  Total Tasks
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {metrics.totalTasks}
                </p>
              </div>
              <div className='text-3xl'>📋</div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  Completed
                </p>
                <p className='text-2xl font-bold text-green-600'>
                  {metrics.completedTasks}
                </p>
              </div>
              <div className='text-3xl'>✅</div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  Completion Rate
                </p>
                <p className='text-2xl font-bold text-blue-600'>
                  {Number(metrics.completionRate ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className='text-3xl'>🎯</div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  Avg. Time
                </p>
                <p className='text-2xl font-bold text-purple-600'>
                  {metrics.averageCompletionTime}min
                </p>
              </div>
              <div className='text-3xl'>⏱️</div>
            </div>
          </div>
        </div>

        {/* Charts and Details */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Tasks by Priority */}
          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Tasks by Priority
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-red-600'>
                  🔴 High Priority
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByPriority.high}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-yellow-600'>
                  🟡 Medium Priority
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByPriority.medium}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-green-600'>
                  🟢 Low Priority
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByPriority.low}
                </span>
              </div>
            </div>
          </div>

          {/* Tasks by Status */}
          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Tasks by Status
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  ⏳ Pending
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByStatus.pending}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-blue-600'>
                  🔄 In Progress
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByStatus.in_progress}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-green-600'>
                  ✅ Completed
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByStatus.completed}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-red-600'>
                  ❌ Cancelled
                </span>
                <span className='text-sm font-bold text-gray-900 dark:text-gray-100'>
                  {metrics.tasksByStatus.cancelled}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8 border border-gray-100 dark:border-gray-700'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            ⚡ Efficiency Metrics
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>
                {metrics.efficiency.onTimeCompletions}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                On-Time Completions
              </p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-600'>
                {metrics.efficiency.totalCompletions}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Total Completions
              </p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-purple-600'>
                {Number(metrics.efficiency?.onTimeRate ?? 0).toFixed(1)}%
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                On-Time Rate
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Performance */}
        {metrics.weeklyData && metrics.weeklyData.length > 0 && (
          <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              📊 Weekly Performance Trend
            </h3>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-700/50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Week
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Tasks Completed
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Average Time (min)
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                  {metrics.weeklyData.map((week, index) => (
                    <tr key={index}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {week.week}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300'>
                        {week.tasksCompleted}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300'>
                        {week.averageTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
