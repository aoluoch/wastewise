export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  REPORTS: {
    BASE: '/reports',
    MY_REPORTS: '/reports/my',
    ASSIGN: '/reports/:id/assign',
    STATUS: '/reports/:id/status',
  },
  PICKUPS: {
    TASKS: '/pickups/tasks',
    MY_TASKS: '/pickups/my-tasks',
    SCHEDULE: '/pickups/schedule/:collectorId',
    START: '/pickups/tasks/:id/start',
    COMPLETE: '/pickups/tasks/:id/complete',
    CANCEL: '/pickups/tasks/:id/cancel',
    RESCHEDULE: '/pickups/tasks/:id/reschedule',
  },
  USERS: {
    BASE: '/users',
    COLLECTORS: '/users/collectors',
    RESIDENTS: '/users/residents',
    ACTIVATE: '/users/:id/activate',
    DEACTIVATE: '/users/:id/deactivate',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    ANALYTICS: '/admin/analytics',
    EXPORT: '/admin/export',
    LOGS: '/admin/logs',
    SETTINGS: '/admin/settings',
  },
} as const;

export const WASTE_TYPES = [
  { value: 'household', label: 'Household Waste', color: 'bg-gray-500' },
  { value: 'electronic', label: 'Electronic Waste', color: 'bg-blue-500' },
  { value: 'hazardous', label: 'Hazardous Waste', color: 'bg-red-500' },
  { value: 'organic', label: 'Organic Waste', color: 'bg-green-500' },
  { value: 'recyclable', label: 'Recyclable Waste', color: 'bg-yellow-500' },
  {
    value: 'construction',
    label: 'Construction Waste',
    color: 'bg-orange-500',
  },
  { value: 'other', label: 'Other', color: 'bg-purple-500' },
] as const;

export const REPORT_STATUSES = [
  {
    value: 'pending',
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
  },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
  {
    value: 'in_progress',
    label: 'In Progress',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
  },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const;

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
] as const;

export const PICKUP_STATUSES = [
  {
    value: 'scheduled',
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
  },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  {
    value: 'rescheduled',
    label: 'Rescheduled',
    color: 'bg-purple-100 text-purple-800',
  },
] as const;

export const USER_ROLES = [
  { value: 'admin', label: 'Administrator', color: 'bg-red-100 text-red-800' },
  {
    value: 'collector',
    label: 'Collector',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'resident',
    label: 'Resident',
    color: 'bg-green-100 text-green-800',
  },
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5,
} as const;

export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 40.7128, lng: -74.006 }, // NYC
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 5,
  MAX_ZOOM: 18,
} as const;

export const NOTIFICATION_TYPES = {
  REPORT_CREATED: 'report_created',
  REPORT_ASSIGNED: 'report_assigned',
  REPORT_UPDATED: 'report_updated',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  PICKUP_STARTED: 'pickup_started',
  PICKUP_COMPLETED: 'pickup_completed',
  TASK_ASSIGNED: 'task_assigned',
  TASK_REMINDER: 'task_reminder',
} as const;

export const THEMES = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
] as const;
