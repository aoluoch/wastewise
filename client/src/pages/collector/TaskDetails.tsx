import React, { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pickupApi } from '../../api/pickupApi'
import { useFetch, useMutation } from '../../hooks/useFetch'
import { useToast } from '../../context/ToastContext'
import { PickupStatus } from '../../types'
import MapView from '../../components/MapView'

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [completionNotes, setCompletionNotes] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)

  // Fetch task details (memoized to avoid re-renders causing refetch loops)
  const fetchTask = useCallback(() => pickupApi.getTask(id!), [id])
  const { data: task, loading, error, refetch } = useFetch(
    fetchTask,
    { immediate: !!id }
  )

  // Mutations
  const startTaskMutation = useMutation(
    () => pickupApi.startTask(id!),
    {
      onSuccess: () => {
        refetch()
        showToast({ type: 'success', title: 'Task Started', message: 'Task has been started successfully' })
      },
      onError: (error) => {
        showToast({ type: 'error', title: 'Error', message: error.message || 'Failed to start task' })
      }
    }
  )

  const completeTaskMutation = useMutation(
    (notes: string) => pickupApi.completeTask(id!, notes),
    {
      onSuccess: () => {
        setShowNotesModal(false)
        setCompletionNotes('')
        refetch()
        showToast({ type: 'success', title: 'Task Completed', message: 'Task has been completed successfully' })
      },
      onError: (error) => {
        showToast({ type: 'error', title: 'Error', message: error.message || 'Failed to complete task' })
      }
    }
  )

  const cancelTaskMutation = useMutation(
    (reason: string) => pickupApi.cancelTask(id!, reason),
    {
      onSuccess: () => {
        refetch()
        showToast({ type: 'success', title: 'Task Cancelled', message: 'Task has been cancelled successfully' })
      },
      onError: (error) => {
        showToast({ type: 'error', title: 'Error', message: error.message || 'Failed to cancel task' })
      }
    }
  )

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const handleStartTask = async () => {
    await startTaskMutation.mutate(undefined)
  }

  const handleCompleteTask = () => {
    setShowNotesModal(true)
  }

  const handleConfirmComplete = async () => {
    await completeTaskMutation.mutate(completionNotes)
  }

  const handleCancelTask = async () => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (reason) {
      await cancelTaskMutation.mutate(reason)
    }
  }

  const handleGoBack = () => {
    navigate('/collector/dashboard')
  }

  const taskLatLng = useMemo(() => {
    const lat = task?.report?.location?.coordinates?.lat
    const lng = task?.report?.location?.coordinates?.lng
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng }
    }
    return null
  }, [task])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center text-red-600 dark:text-red-400 py-8">
            <span className="text-4xl mb-4 block">⚠️</span>
            <p>Error loading task: {error?.message || 'Task not found'}</p>
            <button 
              onClick={handleGoBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.report?.priority || 'medium')}`}>
              {(task.report?.priority || 'medium').toUpperCase()} PRIORITY
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Task Details
        </h1>
      </div>

      {/* Task Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Task Details */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Task Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task ID
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm">{task.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Waste Type
                </label>
                <p className="text-gray-900 dark:text-white">{task.report?.type || 'Unknown Type'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <p className="text-gray-900 dark:text-white">{task.report?.description || 'No description'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Volume
                </label>
                <p className="text-gray-900 dark:text-white">{task.report?.estimatedVolume || 0} kg</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Duration
                </label>
                <p className="text-gray-900 dark:text-white">{task.estimatedDuration} minutes</p>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Schedule Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Date
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(task.scheduledDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Time
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(task.scheduledDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {task.actualStartTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Actual Start Time
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(task.actualStartTime).toLocaleString()}
                  </p>
                </div>
              )}
              {task.actualEndTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Actual End Time
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(task.actualEndTime).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Location & Actions */}
        <div className="space-y-6">
          {/* Location Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Location Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <p className="text-gray-900 dark:text-white">{task.report?.location?.address || 'No address provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Coordinates
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm">
                  {task.report?.location?.coordinates?.lat?.toFixed(6) || 'N/A'}, {task.report?.location?.coordinates?.lng?.toFixed(6) || 'N/A'}
                </p>
              </div>
              {taskLatLng ? (
                <div>
                  <MapView
                    center={taskLatLng}
                    zoom={14}
                    interactive={false}
                    height="320px"
                    markers={[{
                      id: task.id,
                      position: taskLatLng,
                      title: task.report?.type || 'Pickup Location',
                      description: task.report?.location?.address,
                      color: '#EF4444'
                    }]}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Map provided by Mapbox
                  </p>
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Location not available
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h2>
            <div className="space-y-3">
              {task.status === 'scheduled' && (
                <>
                  <button
                    onClick={handleStartTask}
                    disabled={startTaskMutation.loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {startTaskMutation.loading ? 'Starting...' : '🚀 Start Task'}
                  </button>
                  <button
                    onClick={handleCancelTask}
                    disabled={cancelTaskMutation.loading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {cancelTaskMutation.loading ? 'Cancelling...' : '❌ Cancel Task'}
                  </button>
                </>
              )}
              {task.status === 'in_progress' && (
                <>
                  <button
                    onClick={handleCompleteTask}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    ✅ Complete Task
                  </button>
                  <button
                    onClick={handleCancelTask}
                    disabled={cancelTaskMutation.loading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {cancelTaskMutation.loading ? 'Cancelling...' : '❌ Cancel Task'}
                  </button>
                </>
              )}
              {task.status === 'completed' && (
                <div className="text-center py-4">
                  <span className="text-green-600 dark:text-green-400 text-lg">✅ Task Completed</span>
                </div>
              )}
              {task.status === 'cancelled' && (
                <div className="text-center py-4">
                  <span className="text-red-600 dark:text-red-400 text-lg">❌ Task Cancelled</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(task.notes || task.completionNotes) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notes
              </h2>
              <div className="space-y-4">
                {task.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Task Notes
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {task.notes}
                    </p>
                  </div>
                )}
                {task.completionNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Completion Notes
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {task.completionNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Complete Task
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add any notes about the task completion..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmComplete}
                  disabled={completeTaskMutation.loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {completeTaskMutation.loading ? 'Completing...' : 'Complete Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetails
