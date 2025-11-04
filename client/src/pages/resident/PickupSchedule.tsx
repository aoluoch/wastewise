import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { pickupApi } from '../../api/pickupApi'
import { PickupTask } from '../../types'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { useSocket } from '../../hooks/useSocket'

const PickupSchedule: React.FC = () => {
  const queryClient = useQueryClient()
  const { socket, isConnected } = useSocket()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const limit = 10

  // Fetch resident's pickup tasks
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['resident-pickups', page],
    queryFn: () => pickupApi.getResidentPickups(page, limit),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleTaskUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['resident-pickups'] })
    }

    const handleAssignTask = () => {
      queryClient.invalidateQueries({ queryKey: ['resident-pickups'] })
    }

    socket.on('task_update', handleTaskUpdate)
    socket.on('assign_task', handleAssignTask)
    socket.on('task_reassigned', handleTaskUpdate)

    return () => {
      socket.off('task_update', handleTaskUpdate)
      socket.off('assign_task', handleAssignTask)
      socket.off('task_reassigned', handleTaskUpdate)
    }
  }, [socket, isConnected, queryClient])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const pickups = data?.data || []
  const pagination = data?.pagination

  // Filter pickups based on status
  const filteredPickups = pickups.filter((pickup: PickupTask) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'upcoming') return isUpcoming(pickup.scheduledDate) && pickup.status === 'scheduled'
    if (statusFilter === 'today') return isToday(pickup.scheduledDate)
    return pickup.status === statusFilter
  })

  // Group pickups by date
  const groupedPickups = filteredPickups.reduce((acc: Record<string, PickupTask[]>, pickup: PickupTask) => {
    const dateKey = new Date(pickup.scheduledDate).toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(pickup)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedPickups).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pickup Schedule
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {pickups.length > 0 
                ? `${pickups.length} scheduled pickup${pickups.length > 1 ? 's' : ''} for your reports`
                : 'No pickups scheduled yet'}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('today')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Pickups List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading pickup schedule...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-500">Error loading pickup schedule</div>
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <span className="text-4xl mb-4 block">📅</span>
            <p className="text-lg font-medium">No scheduled pickups</p>
            <p className="text-sm mt-2">
              {statusFilter === 'all'
                ? 'Your pickup schedule will appear here once pickups are scheduled for your reports'
                : `No ${statusFilter === 'today' ? 'pickups today' : statusFilter} pickups found`}
            </p>
            <div className="mt-4">
              <Link to="/resident/report">
                <Button variant="primary">Report Waste</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedDates.map((dateKey) => (
              <div key={dateKey} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(dateKey)}
                  </h2>
                  {isToday(dateKey) && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Today
                    </span>
                  )}
                  {isUpcoming(dateKey) && !isToday(dateKey) && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Upcoming
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {groupedPickups[dateKey].map((pickup: PickupTask) => (
                    <div
                      key={pickup.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {pickup.report.type === 'Organic' ? '🍃' :
                               pickup.report.type === 'Recyclable' ? '♻️' :
                               pickup.report.type === 'Hazardous' ? '☢️' :
                               pickup.report.type === 'Electronic' ? '🔌' : '🗑️'}
                            </span>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              {pickup.report.type} Waste Pickup
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {pickup.report.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pickup.status)}`}>
                              {pickup.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(pickup.report.priority)}`}>
                              {pickup.report.priority} priority
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ⏱️ {pickup.estimatedDuration} min
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <p>📍 {pickup.report.location.address}</p>
                            {pickup.notes && (
                              <p className="mt-1">📝 {pickup.notes}</p>
                            )}
                            {pickup.actualStartTime && (
                              <p className="mt-1">
                                🕐 Started: {formatTime(pickup.actualStartTime)}
                              </p>
                            )}
                            {pickup.actualEndTime && (
                              <p className="mt-1">
                                ✅ Completed: {formatTime(pickup.actualEndTime)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatTime(pickup.scheduledDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
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
  )
}

export default PickupSchedule
