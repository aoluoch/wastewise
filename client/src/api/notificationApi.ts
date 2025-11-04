import { axiosInstance } from './axiosInstance'
import { 
  Notification, 
  NotificationFilters, 
  ApiResponse, 
  PaginatedResponse 
} from '../types'

interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  unreadCount: number
}

export const notificationApi = {
  async getNotifications(
    filters?: NotificationFilters, 
    page = 1, 
    limit = 20
  ): Promise<PaginatedResponse<Notification> & { unreadCount: number }> {
    const params = new URLSearchParams()
    
    if (filters?.type) {
      params.append('type', filters.type)
    }
    if (filters?.isRead !== undefined) {
      params.append('isRead', filters.isRead.toString())
    }
    
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await axiosInstance.get<ApiResponse<NotificationsResponse>>(
      `/notifications?${params.toString()}`
    )
    
    const responseData = response.data.data
    return {
      data: responseData.notifications || [],
      pagination: responseData.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0
      },
      unreadCount: responseData.unreadCount || 0
    }
  },

  async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count'
    )
    return response.data.data.unreadCount
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await axiosInstance.patch<ApiResponse<{ notification: Notification }>>(
      `/notifications/${id}/read`
    )
    return response.data.data.notification
  },

  async markAllAsRead(): Promise<void> {
    await axiosInstance.patch('/notifications/mark-all-read')
  },

  async deleteNotification(id: string): Promise<void> {
    await axiosInstance.delete(`/notifications/${id}`)
  },

  async clearAll(): Promise<void> {
    await axiosInstance.delete('/notifications/clear-all')
  }
}
