import axios from 'axios'
import { ApiError } from '../types'

// Ensure the base URL always includes /api prefix
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL
  
  // If no env URL, use /api for relative paths
  if (!envURL) {
    return '/api'
  }
  
  // If env URL already ends with /api, use it as is
  if (envURL.endsWith('/api')) {
    return envURL
  }
  
  // Otherwise, append /api to the env URL
  return `${envURL}/api`
}

const baseURL = getBaseURL()

export const axiosInstance = axios.create({
  baseURL,
  timeout: 60000, // Increased timeout to 60 seconds for AI image processing
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          })

          const { token, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('token', token)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens but don't redirect immediately
        // Let the AuthContext handle the redirect logic
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        return Promise.reject(refreshError)
      }
    }

    // Transform error response
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors,
    }

    return Promise.reject(apiError)
  }
)
