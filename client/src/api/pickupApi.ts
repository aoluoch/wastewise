import { axiosInstance } from './axiosInstance'
import { 
  PickupTask, 
  PickupSchedule, 
  CreatePickupData, 
  PickupFilters, 
  ApiResponse, 
  PaginatedResponse 
} from '../types'

// API response types
interface TasksResponse {
  pickupTasks: PickupTask[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CollectorStats {
  total: number
  completed: number
  inProgress: number
  scheduled: number
  cancelled: number
  completionRate: number
  today: {
    total: number
    completed: number
    inProgress: number
    scheduled: number
    totalDuration: number
    highPriority: number
  }
  thisWeek: {
    total: number
    completed: number
    completionRate: number
  }
}

interface PerformanceMetrics {
  totalTasks: number
  completedTasks: number
  completionRate: number
  averageCompletionTime: number
  tasksByPriority: {
    high: number
    medium: number
    low: number
  }
  tasksByStatus: {
    pending: number
    in_progress: number
    completed: number
    cancelled: number
  }
  weeklyData: Array<{
    week: string
    tasksCompleted: number
    averageTime: number
  }>
  efficiency: {
    onTimeCompletions: number
    totalCompletions: number
    onTimeRate: number
  }
}

export const pickupApi = {
  async getTasks(filters?: PickupFilters, page = 1, limit = 10): Promise<PaginatedResponse<PickupTask>> {
    const params = new URLSearchParams()
    
    if (filters?.status) {
      filters.status.forEach(status => params.append('status', status))
    }
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    if (filters?.collectorId) {
      params.append('collectorId', filters.collectorId)
    }
    
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await axiosInstance.get<ApiResponse<TasksResponse>>(
      `/pickups/tasks?${params.toString()}`
    )
    
    const responseData = response.data.data
    return {
      data: responseData.pickupTasks || [],
      pagination: responseData.pagination || {
        page: page,
        limit: limit,
        total: 0,
        totalPages: 0
      }
    }
  },

  async getTask(id: string): Promise<PickupTask> {
    const response = await axiosInstance.get<ApiResponse<unknown>>(`/pickups/tasks/${id}`)
    const raw = (response.data.data || {}) as Record<string, unknown>

    const taskId = (typeof raw.id === 'string' ? raw.id : undefined) || (typeof raw._id === 'string' ? (raw._id as string) : '')

    const reportFromT = (raw.report as Record<string, unknown> | undefined) || (raw.reportId as Record<string, unknown> | undefined) || {}
    const reportIdRaw = raw.reportId
    let reportId: string | undefined
    if (typeof reportIdRaw === 'string') {
      reportId = reportIdRaw
    } else if (reportIdRaw && typeof reportIdRaw === 'object' && '_id' in reportIdRaw) {
      const maybe = reportIdRaw as { _id?: unknown }
      reportId = typeof maybe._id === 'string' ? maybe._id : undefined
    } else if (reportFromT && typeof reportFromT === 'object' && 'id' in reportFromT) {
      reportId = typeof (reportFromT as { id?: unknown }).id === 'string' ? (reportFromT as { id?: string }).id : undefined
    } else if (reportFromT && typeof reportFromT === 'object' && '_id' in reportFromT) {
      reportId = typeof (reportFromT as { _id?: unknown })._id === 'string' ? (reportFromT as { _id?: string })._id : undefined
    }

    const collectorIdRaw = raw.collectorId
    let collectorId: string | undefined
    if (typeof collectorIdRaw === 'string') {
      collectorId = collectorIdRaw
    } else if (collectorIdRaw && typeof collectorIdRaw === 'object' && '_id' in collectorIdRaw) {
      const maybe = collectorIdRaw as { _id?: unknown }
      collectorId = typeof maybe._id === 'string' ? maybe._id : undefined
    }

    const report = reportFromT as Record<string, unknown>

    const normalized: PickupTask = {
      id: taskId || '',
      reportId: reportId || '',
      collectorId: collectorId || '',
      status: (typeof raw.status === 'string' ? (raw.status as PickupTask['status']) : 'scheduled'),
      scheduledDate: (typeof raw.scheduledDate === 'string' ? (raw.scheduledDate as string) : ''),
      estimatedDuration: (typeof raw.estimatedDuration === 'number' ? (raw.estimatedDuration as number) : 0),
      actualStartTime: typeof raw.actualStartTime === 'string' ? (raw.actualStartTime as string) : undefined,
      actualEndTime: typeof raw.actualEndTime === 'string' ? (raw.actualEndTime as string) : undefined,
      notes: typeof raw.notes === 'string' ? (raw.notes as string) : undefined,
      completionNotes: typeof raw.completionNotes === 'string' ? (raw.completionNotes as string) : undefined,
      images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
      createdAt: typeof raw.createdAt === 'string' ? (raw.createdAt as string) : '',
      updatedAt: typeof raw.updatedAt === 'string' ? (raw.updatedAt as string) : '',
      report: {
        id: (typeof report.id === 'string' ? (report.id as string) : (typeof report._id === 'string' ? (report._id as string) : '')),
        type: typeof report.type === 'string' ? (report.type as string) : '',
        description: typeof report.description === 'string' ? (report.description as string) : '',
        location: (report.location as unknown as PickupTask['report']['location']) || {
          address: '',
          coordinates: { lat: 0, lng: 0 },
        },
        priority: typeof report.priority === 'string' ? (report.priority as string) : 'medium',
        estimatedVolume: typeof report.estimatedVolume === 'number' ? (report.estimatedVolume as number) : 0,
      },
    }

    return normalized
  },

  async createTask(data: CreatePickupData): Promise<PickupTask> {
    const response = await axiosInstance.post<ApiResponse<PickupTask>>('/pickups/tasks', data)
    return response.data.data
  },

  async updateTask(id: string, data: Partial<PickupTask>): Promise<PickupTask> {
    const response = await axiosInstance.put<ApiResponse<PickupTask>>(`/pickups/tasks/${id}`, data)
    return response.data.data
  },

  async deleteTask(id: string): Promise<void> {
    await axiosInstance.delete(`/pickups/tasks/${id}`)
  },

  async startTask(id: string): Promise<PickupTask> {
    const response = await axiosInstance.post<ApiResponse<PickupTask>>(`/pickups/tasks/${id}/start`)
    return response.data.data
  },

  async updateTaskLocation(id: string, location: { latitude: number; longitude: number }): Promise<PickupTask> {
    const response = await axiosInstance.post<ApiResponse<PickupTask>>(
      `/pickups/tasks/${id}/update-location`,
      location
    )
    return response.data.data
  },

  async completeTask(id: string, notes?: string): Promise<PickupTask> {
    const response = await axiosInstance.post<ApiResponse<PickupTask>>(
      `/pickups/tasks/${id}/complete`,
      { notes }
    )
    return response.data.data
  },

  async cancelTask(id: string, reason?: string): Promise<PickupTask> {
    const response = await axiosInstance.post<ApiResponse<PickupTask>>(
      `/pickups/tasks/${id}/cancel`,
      { reason }
    )
    return response.data.data
  },

  async getSchedule(collectorId: string, date: string): Promise<PickupSchedule> {
    const response = await axiosInstance.get<ApiResponse<PickupSchedule>>(
      `/pickups/schedule/${collectorId}?date=${date}`
    )
    return response.data.data
  },

  async getMyTasks(page = 1, limit = 10): Promise<PaginatedResponse<PickupTask>> {
    try {
      const response = await axiosInstance.get<ApiResponse<TasksResponse>>(
        `/pickups/my-tasks?page=${page}&limit=${limit}`
      )
      
      // Handle the backend response structure
      const responseData = response.data.data

      // Normalize backend task shape to frontend PickupTask shape
      const rawTasks: unknown[] = Array.isArray(responseData.pickupTasks)
        ? (responseData.pickupTasks as unknown[])
        : []

      const normalizedTasks = rawTasks.map((raw: unknown) => {
        const t = (raw || {}) as Record<string, unknown>
        const id = (typeof t.id === 'string' ? t.id : undefined) || (typeof t._id === 'string' ? t._id : undefined)

        // Normalize report and reportId
        const reportFromT = (t.report as Record<string, unknown> | undefined) || (t.reportId as Record<string, unknown> | undefined) || {}
        const reportIdRaw = t.reportId
        let reportId: string | undefined
        if (typeof reportIdRaw === 'string') {
          reportId = reportIdRaw
        } else if (reportIdRaw && typeof reportIdRaw === 'object' && '_id' in reportIdRaw) {
          const maybe = reportIdRaw as { _id?: unknown }
          reportId = typeof maybe._id === 'string' ? maybe._id : undefined
        } else if (reportFromT && typeof reportFromT === 'object' && 'id' in reportFromT) {
          reportId = typeof (reportFromT as { id?: unknown }).id === 'string' ? (reportFromT as { id?: string }).id : undefined
        } else if (reportFromT && typeof reportFromT === 'object' && '_id' in reportFromT) {
          reportId = typeof (reportFromT as { _id?: unknown })._id === 'string' ? (reportFromT as { _id?: string })._id : undefined
        }

        // Normalize collectorId
        const collectorIdRaw = t.collectorId
        let collectorId: string | undefined
        if (typeof collectorIdRaw === 'string') {
          collectorId = collectorIdRaw
        } else if (collectorIdRaw && typeof collectorIdRaw === 'object' && '_id' in collectorIdRaw) {
          const maybe = collectorIdRaw as { _id?: unknown }
          collectorId = typeof maybe._id === 'string' ? maybe._id : undefined
        }

        const report = reportFromT as Record<string, unknown>

        const normalized: PickupTask = {
          id: id ?? '',
          reportId: reportId ?? '',
          collectorId: collectorId ?? '',
          status: (typeof t.status === 'string' ? (t.status as PickupTask['status']) : 'scheduled'),
          scheduledDate: (typeof t.scheduledDate === 'string' ? (t.scheduledDate as string) : ''),
          estimatedDuration: (typeof t.estimatedDuration === 'number' ? t.estimatedDuration : 0),
          actualStartTime: typeof t.actualStartTime === 'string' ? (t.actualStartTime as string) : undefined,
          actualEndTime: typeof t.actualEndTime === 'string' ? (t.actualEndTime as string) : undefined,
          notes: typeof t.notes === 'string' ? (t.notes as string) : undefined,
          completionNotes: typeof t.completionNotes === 'string' ? (t.completionNotes as string) : undefined,
          images: Array.isArray(t.images) ? (t.images as string[]) : [],
          createdAt: typeof t.createdAt === 'string' ? (t.createdAt as string) : '',
          updatedAt: typeof t.updatedAt === 'string' ? (t.updatedAt as string) : '',
          report: {
            id: (typeof report.id === 'string' ? (report.id as string) : (typeof report._id === 'string' ? (report._id as string) : '')),
            type: typeof report.type === 'string' ? (report.type as string) : '',
            description: typeof report.description === 'string' ? (report.description as string) : '',
            location: (report.location as unknown as PickupTask['report']['location']) || {
              address: '',
              coordinates: { lat: 0, lng: 0 },
            },
            priority: typeof report.priority === 'string' ? (report.priority as string) : 'medium',
            estimatedVolume: typeof report.estimatedVolume === 'number' ? (report.estimatedVolume as number) : 0,
          },
        }

        return normalized
      })

      return {
        data: normalizedTasks,
        pagination: responseData.pagination || {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0
        }
      }
    } catch {
      // Return empty result instead of throwing to prevent crashes
      return {
        data: [],
        pagination: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0
        }
      }
    }
  },

  async rescheduleTask(id: string, newDate: string): Promise<PickupTask> {
    const response = await axiosInstance.post<ApiResponse<PickupTask>>(
      `/pickups/tasks/${id}/reschedule`,
      { scheduledDate: newDate }
    )
    return response.data.data
  },

  async getCollectorStats(): Promise<CollectorStats> {
    try {
      // Add cache-busting parameter to avoid cached 429 responses
      const cacheBuster = Date.now()
      const response = await axiosInstance.get<ApiResponse<CollectorStats>>(`/pickups/collector/stats?_=${cacheBuster}`)
      return response.data.data
    } catch {
      // Return default stats instead of throwing to prevent crashes
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        scheduled: 0,
        cancelled: 0,
        completionRate: 0,
        today: {
          total: 0,
          completed: 0,
          inProgress: 0,
          scheduled: 0,
          totalDuration: 0,
          highPriority: 0
        },
        thisWeek: {
          total: 0,
          completed: 0,
          completionRate: 0
        }
      }
    }
  },

  async getCollectorPerformance(period: 'week' | 'month' | 'year' = 'month'): Promise<PerformanceMetrics> {
    const response = await axiosInstance.get<ApiResponse<PerformanceMetrics>>(`/pickups/collector/performance?period=${period}`)
    return response.data.data
  },

  // Get resident's pickup schedule (tasks for their reports)
  async getResidentPickups(page = 1, limit = 20): Promise<PaginatedResponse<PickupTask>> {
    try {
      const response = await axiosInstance.get<ApiResponse<TasksResponse>>(
        `/pickups/tasks?page=${page}&limit=${limit}`
      )
      
      const responseData = response.data.data
      const rawTasks: unknown[] = Array.isArray(responseData.pickupTasks)
        ? (responseData.pickupTasks as unknown[])
        : []

      const normalizedTasks = rawTasks.map((raw: unknown) => {
        const t = (raw || {}) as Record<string, unknown>
        const id = (typeof t.id === 'string' ? t.id : undefined) || (typeof t._id === 'string' ? t._id : undefined)

        const reportFromT = (t.report as Record<string, unknown> | undefined) || (t.reportId as Record<string, unknown> | undefined) || {}
        const reportIdRaw = t.reportId
        let reportId: string | undefined
        if (typeof reportIdRaw === 'string') {
          reportId = reportIdRaw
        } else if (reportIdRaw && typeof reportIdRaw === 'object' && '_id' in reportIdRaw) {
          const maybe = reportIdRaw as { _id?: unknown }
          reportId = typeof maybe._id === 'string' ? maybe._id : undefined
        } else if (reportFromT && typeof reportFromT === 'object' && 'id' in reportFromT) {
          reportId = typeof (reportFromT as { id?: unknown }).id === 'string' ? (reportFromT as { id?: string }).id : undefined
        } else if (reportFromT && typeof reportFromT === 'object' && '_id' in reportFromT) {
          reportId = typeof (reportFromT as { _id?: unknown })._id === 'string' ? (reportFromT as { _id?: string })._id : undefined
        }

        const collectorIdRaw = t.collectorId
        let collectorId: string | undefined
        if (typeof collectorIdRaw === 'string') {
          collectorId = collectorIdRaw
        } else if (collectorIdRaw && typeof collectorIdRaw === 'object' && '_id' in collectorIdRaw) {
          const maybe = collectorIdRaw as { _id?: unknown }
          collectorId = typeof maybe._id === 'string' ? maybe._id : undefined
        }

        const report = reportFromT as Record<string, unknown>

        const normalized: PickupTask = {
          id: id ?? '',
          reportId: reportId ?? '',
          collectorId: collectorId ?? '',
          status: (typeof t.status === 'string' ? (t.status as PickupTask['status']) : 'scheduled'),
          scheduledDate: (typeof t.scheduledDate === 'string' ? (t.scheduledDate as string) : ''),
          estimatedDuration: (typeof t.estimatedDuration === 'number' ? t.estimatedDuration : 0),
          actualStartTime: typeof t.actualStartTime === 'string' ? (t.actualStartTime as string) : undefined,
          actualEndTime: typeof t.actualEndTime === 'string' ? (t.actualEndTime as string) : undefined,
          notes: typeof t.notes === 'string' ? (t.notes as string) : undefined,
          completionNotes: typeof t.completionNotes === 'string' ? (t.completionNotes as string) : undefined,
          images: Array.isArray(t.images) ? (t.images as string[]) : [],
          createdAt: typeof t.createdAt === 'string' ? (t.createdAt as string) : '',
          updatedAt: typeof t.updatedAt === 'string' ? (t.updatedAt as string) : '',
          report: {
            id: (typeof report.id === 'string' ? (report.id as string) : (typeof report._id === 'string' ? (report._id as string) : '')),
            type: typeof report.type === 'string' ? (report.type as string) : '',
            description: typeof report.description === 'string' ? (report.description as string) : '',
            location: (report.location as unknown as PickupTask['report']['location']) || {
              address: '',
              coordinates: { lat: 0, lng: 0 },
            },
            priority: typeof report.priority === 'string' ? (report.priority as string) : 'medium',
            estimatedVolume: typeof report.estimatedVolume === 'number' ? (report.estimatedVolume as number) : 0,
          },
        }

        return normalized
      })

      return {
        data: normalizedTasks,
        pagination: responseData.pagination || {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0
        }
      }
    } catch {
      return {
        data: [],
        pagination: {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 0
        }
      }
    }
  },
}
