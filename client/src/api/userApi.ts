import { axiosInstance } from './axiosInstance';
import { User, ApiResponse, PaginatedResponse } from '../types';

export const userApi = {
  async getUsers(
    page = 1,
    limit = 10,
    role?: string
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (role) {
      params.append('role', role);
    }

    const response = await axiosInstance.get<
      ApiResponse<PaginatedResponse<User>>
    >(`/users?${params.toString()}`);
    return response.data.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<ApiResponse<User>>(
      `/users/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  async activateUser(id: string): Promise<User> {
    const response = await axiosInstance.post<ApiResponse<User>>(
      `/users/${id}/activate`
    );
    return response.data.data;
  },

  async deactivateUser(id: string): Promise<User> {
    const response = await axiosInstance.post<ApiResponse<User>>(
      `/users/${id}/deactivate`
    );
    return response.data.data;
  },

  async getCollectors(): Promise<User[]> {
    const response =
      await axiosInstance.get<ApiResponse<User[]>>('/users/collectors');
    return response.data.data;
  },

  async getResidents(): Promise<User[]> {
    const response =
      await axiosInstance.get<ApiResponse<User[]>>('/users/residents');
    return response.data.data;
  },
};
