import { axiosInstance } from './axiosInstance';

export const statisticsApi = {
  getResidentStats: async () => {
    const { data } = await axiosInstance.get('/statistics/resident');
    return data.data;
  },
};
