export interface User {
  id: string
  _id: string // For MongoDB compatibility
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  address?: Address
  isActive: boolean
  collectorApplicationStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export type UserRole = 'admin' | 'collector' | 'resident'

export interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface AuthUser extends Omit<User, 'password'> {
  token: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: Omit<Address, 'coordinates'>
}
