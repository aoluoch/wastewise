import axios from 'axios'
import { ApiError } from '../types'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

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
