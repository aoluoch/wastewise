export * from './user'
export * from './report'
export * from './pickup'
export * from './notification'

// Type aliases for compatibility
export type { WasteReport as Report } from './report'

export type Theme = 'light' | 'dark' | 'system'

export interface Coordinates {
  lat: number
  lng: number
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}
