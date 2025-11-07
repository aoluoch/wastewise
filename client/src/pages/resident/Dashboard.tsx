import React, { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/Button'
import { Link } from 'react-router-dom'
import { statisticsApi } from '../../api/statisticsApi'
import { useSocket } from '../../hooks/useSocket'
import CollectorApplicationForm from '../../components/CollectorApplicationForm'

const ResidentDashboard: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket()
  
  // Fetch resident statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['statistics', 'resident'],
    queryFn: statisticsApi.getResidentStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return

    // Listen for new reports
    const handleNewReport = () => {
      queryClient.invalidateQueries({ queryKey: ['statistics', 'resident'] })
    }

    // Listen for report updates
    const handleReportUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['statistics', 'resident'] })
    }

    // Listen for report deletions
    const handleReportDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ['statistics', 'resident'] })
    }

    // Listen for task updates (affects pickup schedules)
    const handleTaskUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['statistics', 'resident'] })
    }

    // Listen for application status updates
    const handleApplicationApproved = (data: { userId: string }) => {
      if (data.userId === user?._id) {
        queryClient.invalidateQueries({ queryKey: ['user'] })
        queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    }

    const handleApplicationRejected = (data: { userId: string }) => {
      if (data.userId === user?._id) {
        queryClient.invalidateQueries({ queryKey: ['user'] })
        queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    }

    socket.on('new_report', handleNewReport)
    socket.on('task_update', handleReportUpdate)
    socket.on('report_deleted', handleReportDeleted)
    socket.on('assign_task', handleTaskUpdate)
    socket.on('application_approved', handleApplicationApproved)
    socket.on('application_rejected', handleApplicationRejected)

    // Cleanup listeners on unmount
    return () => {
      socket.off('new_report', handleNewReport)
      socket.off('task_update', handleReportUpdate)
      socket.off('report_deleted', handleReportDeleted)
      socket.off('assign_task', handleTaskUpdate)
      socket.off('application_approved', handleApplicationApproved)
      socket.off('application_rejected', handleApplicationRejected)
    }
  }, [socket, isConnected, queryClient, user?._id])

  return (
    <div className="space-y-6 font-['Poppins']">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your waste reports and track pickup schedules
        </p>
      </div>

      {/* Collector Application Status Notification */}
      {user?.collectorApplicationStatus === 'approved' && user?.role !== 'collector' && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                🎉 Application Approved!
              </h3>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                Congratulations! Your application to become a collector has been approved. Please log out and log back in to access your collector dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {user?.collectorApplicationStatus === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Application Not Approved
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                Unfortunately, your collector application was not approved at this time. You can reapply using the form below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 lg:gap-6">
        <Link to="/resident/report">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                <span className="text-xl lg:text-2xl">📝</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Report Waste
                </h3>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">
                  Report new waste issues
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/resident/schedule">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                <span className="text-xl lg:text-2xl">📅</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Pickup Schedule
                </h3>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">
                  View upcoming pickups
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/resident/notifications">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                <span className="text-xl lg:text-2xl">🔔</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Notifications
                </h3>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">
                  View your notifications
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/resident/statistics">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
          <div className="flex items-center">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3 lg:mr-4">
              <span className="text-xl lg:text-2xl">📊</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                My Statistics
              </h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate">
                  View detailed statistics
              </p>
            </div>
          </div>
        </div>
        </Link>
      </div>

      {/* Collector Application Section */}
      <CollectorApplicationForm />

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Reports
            </h2>
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading reports...</div>
              </div>
            ) : statsError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">Error loading reports</div>
              </div>
            ) : stats?.recentReports && Array.isArray(stats.recentReports) && stats.recentReports.length > 0 ? (
              <div className="space-y-3">
                {stats.recentReports.slice(0, 3).map((report: { _id: string; type: string; description: string; status: string; createdAt: string }) => (
                  <div key={report._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {report.type} • {report.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      report.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                      report.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                    View all reports →
                  </Link>
                </div>
              </div>
            ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <span className="text-4xl mb-4 block">📋</span>
              <p>No recent reports</p>
              <p className="text-sm">
                {stats?.overview?.totalReports > 0 
                  ? "You have reports but none are recent" 
                  : "Start by reporting a waste issue"
                }
              </p>
              <div className="mt-4 space-x-2">
                <Link to="/resident/report" className="inline-block">
                <Button variant="primary">Report Waste</Button>
              </Link>
                {stats?.overview?.totalReports > 0 && (
                  <Link to="/reports" className="inline-block">
                    <Button variant="outline">View All Reports</Button>
                  </Link>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Statistics
            </h2>
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading statistics...</div>
              </div>
            ) : statsError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">Error loading statistics</div>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.overview?.totalReports || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats?.overview?.completedReports || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats?.overview?.pendingReports || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Pending</div>
              </div>
              <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.overview?.completionRate || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow lg:col-span-2 xl:col-span-1">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Tips
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 mt-1">✓</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Take clear photos of waste issues for better tracking
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 mt-1">✓</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Report issues as soon as you notice them
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 mt-1">✓</span>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Check pickup schedules regularly
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResidentDashboard
