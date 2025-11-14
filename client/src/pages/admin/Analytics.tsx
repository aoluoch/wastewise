import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, ReportAnalytics, UserAnalytics } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

const AdminAnalytics: React.FC = () => {
  const [reportAnalytics, setReportAnalytics] =
    useState<ReportAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const { showToast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [reportData, userData] = await Promise.all([
        adminApi.getReportAnalytics(dateRange),
        adminApi.getUserAnalytics(dateRange),
      ]);
      setReportAnalytics(reportData);
      setUserAnalytics(userData);
    } catch {
      showToast({ message: 'Failed to load analytics data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dateRange, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className='h-64 bg-gray-300 dark:bg-gray-700 rounded'
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Analytics Dashboard
          </h1>
          <div className='flex space-x-4'>
            <input
              type='date'
              value={dateRange.start}
              onChange={e =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
            <input
              type='date'
              value={dateRange.end}
              onChange={e =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>
        </div>

        {/* Reports Analytics */}
        {reportAnalytics && (
          <div className='space-y-8'>
            {/* Reports by Type */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Reports by Type
              </h2>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={reportAnalytics.reportsByType}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='type' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='count' fill='#3B82F6' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reports by Status */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Reports by Status
              </h2>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={reportAnalytics.reportsByStatus}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='count'
                    >
                      {reportAnalytics.reportsByStatus.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reports by Priority */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Reports by Priority
              </h2>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={reportAnalytics.reportsByPriority}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='priority' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='count' fill='#10B981' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trends */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Monthly Trends
              </h2>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={reportAnalytics.reportsByMonth}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type='monotone'
                      dataKey='count'
                      stroke='#8884d8'
                      fill='#8884d8'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Collectors */}
            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Top Collectors
              </h2>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={reportAnalytics.topCollectors}
                    layout='horizontal'
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis dataKey='name' type='category' width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='completedTasks' fill='#F59E0B' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* User Analytics */}
        {userAnalytics && (
          <div className='mt-8 space-y-8'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
              User Analytics
            </h2>

            {/* Users by Role */}
            <div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                Users by Role
              </h3>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={userAnalytics.usersByRole}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ role, count }) => `${role}: ${count}`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='count'
                    >
                      {userAnalytics.usersByRole.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Growth */}
            <div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
                User Growth
              </h3>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={userAnalytics.usersByMonth}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='count'
                      stroke='#8884d8'
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Status Summary */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-6'>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  Active Users
                </h4>
                <p className='text-3xl font-bold text-green-600 dark:text-green-400'>
                  {userAnalytics.activeUsers}
                </p>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-6'>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  Inactive Users
                </h4>
                <p className='text-3xl font-bold text-red-600 dark:text-red-400'>
                  {userAnalytics.inactiveUsers}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
