import { axiosInstance } from './axiosInstance';
import {
  WasteReport,
  CreateReportData,
  ReportFilters,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export const reportApi = {
  async getReports(
    filters?: ReportFilters,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<WasteReport>> {
    const params = new URLSearchParams();

    if (filters?.status) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.type) {
      filters.type.forEach(type => params.append('type', type));
    }
    if (filters?.priority) {
      filters.priority.forEach(priority => params.append('priority', priority));
    }
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await axiosInstance.get<
      ApiResponse<PaginatedResponse<WasteReport>>
    >(`/reports?${params.toString()}`);
    return response.data.data;
  },

  async getReport(id: string): Promise<WasteReport> {
    const response = await axiosInstance.get<ApiResponse<WasteReport>>(
      `/reports/${id}`
    );
    return response.data.data;
  },

  async createReport(data: CreateReportData): Promise<WasteReport> {
    const formData = new FormData();

    formData.append('type', data.type);
    formData.append('description', data.description);
    formData.append('location', JSON.stringify(data.location));
    formData.append('estimatedVolume', data.estimatedVolume.toString());

    if (data.notes) {
      formData.append('notes', data.notes);
    }

    data.images.forEach(image => {
      formData.append(`images`, image);
    });

    const response = await axiosInstance.post<ApiResponse<WasteReport>>(
      '/reports',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async updateReport(
    id: string,
    data: Partial<WasteReport>
  ): Promise<WasteReport> {
    const response = await axiosInstance.put<ApiResponse<WasteReport>>(
      `/reports/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteReport(id: string): Promise<void> {
    await axiosInstance.delete(`/reports/${id}`);
  },

  async assignCollector(
    reportId: string,
    collectorId: string
  ): Promise<WasteReport> {
    const response = await axiosInstance.post<ApiResponse<WasteReport>>(
      `/reports/${reportId}/assign`,
      { collectorId }
    );
    return response.data.data;
  },

  async updateStatus(reportId: string, status: string): Promise<WasteReport> {
    const response = await axiosInstance.patch<ApiResponse<WasteReport>>(
      `/reports/${reportId}/status`,
      { status }
    );
    return response.data.data;
  },

  async getMyReports(
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<WasteReport>> {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedResponse<WasteReport>>
    >(`/reports/my?page=${page}&limit=${limit}`);
    return response.data.data;
  },
};
