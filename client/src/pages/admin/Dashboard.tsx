import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi, DashboardStats } from '../../api/adminApi'
import { useToast } from '../../context/ToastContext'
import { axiosInstance } from '../../api/axiosInstance'

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingApplications, setPendingApplications] = useState(0)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboardStats()
        setStats(data)
      } catch {
        showToast({ message: 'Failed to load dashboard statistics', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    const fetchApplications = async () => {
      try {
        const response = await axiosInstance.get('/admin/collector-applications')
        setPendingApplications(response.data.data.applications.length)
      } catch {
        // Silently fail - not critical
      }
    }

    fetchStats()
    fetchApplications()
  }, [showToast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Dashboard
          </h1>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p>Failed to load dashboard data</p>
          </div>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, subtitle, icon, trend, trendValue }: {
    title: string
    value: number | string
    subtitle?: string
    icon: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {trend && trendValue && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Dashboard
        </h1>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Reports"
            value={stats.totalReports}
            subtitle="All time"
            icon="📊"
            trend="up"
            trendValue={`${stats.reportsGrowth > 0 ? '+' : ''}${stats.reportsGrowth.toFixed(1)}% this month`}
          />
          <StatCard
            title="Pending Reports"
            value={stats.pendingReports}
            subtitle="Awaiting action"
            icon="⏳"
          />
          <StatCard
            title="Completed Reports"
            value={stats.completedReports}
            subtitle={`${stats.completionRate.toFixed(1)}% completion rate`}
            icon="✅"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressReports}
            subtitle="Currently being handled"
            icon="🔄"
          />
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Collectors"
            value={stats.totalCollectors}
            subtitle={`${stats.activeCollectors} active`}
            icon="👷"
          />
          <StatCard
            title="Active Collectors"
            value={stats.activeCollectors}
            subtitle={`${((stats.activeCollectors / stats.totalCollectors) * 100).toFixed(1)}% of total`}
            icon="👷‍♂️"
          />
          <StatCard
            title="Total Residents"
            value={stats.totalResidents}
            subtitle={`${stats.activeResidents} active`}
            icon="🏠"
          />
          <StatCard
            title="Active Residents"
            value={stats.activeResidents}
            subtitle={`${((stats.activeResidents / stats.totalResidents) * 100).toFixed(1)}% of total`}
            icon="👤"
          />
        </div>

        {/* Pickup Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Pickups"
            value={stats.totalPickups}
            subtitle="All time"
            icon="🚛"
          />
          <StatCard
            title="Completed Pickups"
            value={stats.completedPickups}
            subtitle={`${((stats.completedPickups / stats.totalPickups) * 100).toFixed(1)}% completion rate`}
            icon="✅"
          />
          <StatCard
            title="Pending Pickups"
            value={stats.pendingPickups}
            subtitle="Scheduled"
            icon="📅"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/admin/reports')}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium text-gray-900 dark:text-white">View All Reports</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Manage waste reports</div>
          </button>
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium text-gray-900 dark:text-white">Manage Users</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">View and manage users</div>
          </button>
          <button 
            onClick={() => navigate('/admin/applications')}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900 dark:text-white">Collector Applications</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Review applications</div>
            {pendingApplications > 0 && (
              <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {pendingApplications}
              </span>
            )}
          </button>
          <button 
            onClick={() => navigate('/admin/analytics')}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-gray-900 dark:text-white">View Analytics</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Detailed analytics</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
