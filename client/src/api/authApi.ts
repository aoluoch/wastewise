import { axiosInstance } from './axiosInstance';
import {
  AuthUser,
  LoginCredentials,
  RegisterData,
  User,
  ApiResponse,
} from '../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await axiosInstance.post<
      ApiResponse<{ user: AuthUser; token: string; refreshToken: string }>
    >('/auth/login', credentials);
    const { user, token, refreshToken } = response.data.data;
    return { ...user, token, refreshToken };
  },

  async register(data: RegisterData): Promise<AuthUser> {
    const response = await axiosInstance.post<
      ApiResponse<{ user: AuthUser; token: string; refreshToken: string }>
    >('/auth/register', data);
    const { user, token, refreshToken } = response.data.data;
    return { ...user, token, refreshToken };
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<AuthUser> {
    const response = await axiosInstance.post<ApiResponse<AuthUser>>(
      '/auth/refresh',
      {
        refreshToken,
      }
    );
    return response.data.data;
  },

  async verifyToken(): Promise<AuthUser> {
    const response =
      await axiosInstance.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
    const user = response.data.data.user;
    // Normalize user data to ensure id field exists
    return {
      ...user,
      id: user.id || user._id || '',
    };
  },

  async getProfile(): Promise<User> {
    const response =
      await axiosInstance.get<ApiResponse<{ user: User }>>('/auth/me');
    const user = response.data.data.user;
    // Normalize user data to ensure id field exists
    return {
      ...user,
      id: user.id || user._id || '',
    };
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<ApiResponse<User>>(
      '/auth/me',
      data
    );
    return response.data.data;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await axiosInstance.put('/auth/change-password', data);
  },

  async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post('/auth/forgot-password', { email });
  },

  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<void> {
    await axiosInstance.post('/auth/reset-password', data);
  },
};
