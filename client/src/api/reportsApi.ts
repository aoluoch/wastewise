import { axiosInstance } from './axiosInstance';

export const reportsApi = {
  create: async (formData: FormData) => {
    const { data } = await axiosInstance.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.report;
  },
  getFeed: async () => {
    const { data } = await axiosInstance.get('/reports/feed');
    return data.data.reports;
  },
  getById: async (id: string) => {
    const { data } = await axiosInstance.get(`/reports/${id}`);
    return data.data.report;
  },
  updateMine: async (
    id: string,
    payload: { description?: string; notes?: string }
  ) => {
    const { data } = await axiosInstance.patch(`/reports/${id}`, payload);
    return data.data.report;
  },
  delete: async (id: string) => {
    await axiosInstance.delete(`/reports/${id}`);
    return true;
  },
};
