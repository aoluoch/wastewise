import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '../../api/statisticsApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

const Statistics: React.FC = () => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['statistics', 'resident'],
    queryFn: statisticsApi.getResidentStats,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-lg'>Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-red-500'>
          Error loading statistics: {error.message}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, charts } = stats;

  // Color schemes for charts
  const statusColors = {
    pending: '#f59e0b',
    assigned: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#ef4444',
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          My Statistics
        </h1>
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'>
              <svg
                className='w-6 h-6 text-blue-600 dark:text-blue-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Total Reports
              </p>
              <p className='text-2xl font-semibold text-gray-900 dark:text-white'>
                {overview.totalReports}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='p-2 bg-green-100 dark:bg-green-900 rounded-lg'>
              <svg
                className='w-6 h-6 text-green-600 dark:text-green-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Completed
              </p>
              <p className='text-2xl font-semibold text-gray-900 dark:text-white'>
                {overview.completedReports}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg'>
              <svg
                className='w-6 h-6 text-yellow-600 dark:text-yellow-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Completion Rate
              </p>
              <p className='text-2xl font-semibold text-gray-900 dark:text-white'>
                {overview.completionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <div className='flex items-center'>
            <div className='p-2 bg-purple-100 dark:bg-purple-900 rounded-lg'>
              <svg
                className='w-6 h-6 text-purple-600 dark:text-purple-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Avg Response Time
              </p>
              <p className='text-2xl font-semibold text-gray-900 dark:text-white'>
                {overview.avgResponseTime}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Reports by Status */}
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Reports by Status
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={charts.reportsByStatus}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill='#8884d8'
                dataKey='count'
              >
                {charts.reportsByStatus.map(
                  (entry: { status: string; count: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        statusColors[
                          entry.status as keyof typeof statusColors
                        ] || '#8884d8'
                      }
                    />
                  )
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Reports by Type */}
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Reports by Type
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={charts.reportsByType}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='type' />
              <YAxis />
              <Tooltip />
              <Bar dataKey='count' fill='#3b82f6' />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Trend */}
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Daily Reports (Last 30 Days)
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <AreaChart data={charts.dailyTrend}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' />
              <YAxis />
              <Tooltip />
              <Area
                type='monotone'
                dataKey='count'
                stroke='#3b82f6'
                fill='#3b82f6'
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Monthly Reports (Last 6 Months)
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={charts.monthlyTrend}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip />
              <Line
                type='monotone'
                dataKey='count'
                stroke='#3b82f6'
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume by Type */}
      <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Waste Volume by Type
        </h3>
        <ResponsiveContainer width='100%' height={400}>
          <BarChart data={charts.volumeByType} layout='horizontal'>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis type='number' />
            <YAxis dataKey='type' type='category' width={100} />
            <Tooltip
              formatter={(value, name) => [
                value,
                name === 'volume' ? 'Volume (cubic meters)' : 'Count',
              ]}
            />
            <Bar dataKey='volume' fill='#10b981' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Statistics;
