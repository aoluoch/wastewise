export type NotificationType = 
  | 'report_created' 
  | 'report_assigned' 
  | 'report_completed' 
  | 'pickup_scheduled' 
  | 'pickup_reminder' 
  | 'system_alert' 
  | 'general'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  _id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  readAt?: string
  data?: Record<string, unknown>
  priority: NotificationPriority
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationFilters {
  type?: NotificationType
  isRead?: boolean
}
