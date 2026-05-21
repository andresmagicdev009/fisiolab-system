import { CurrentDbUser } from 'types/models';
import apiClient from './apiClient';

export const userService = {
  getMe: async (): Promise<CurrentDbUser> => {
    const { data } = await apiClient.get<CurrentDbUser>('/users/me');
    return data;
  },

  listAll: async (): Promise<CurrentDbUser[]> => {
    const { data } = await apiClient.get<CurrentDbUser[]>('/users');
    return data;
  },
};
