import { apiClient } from '@/api/apiClient';

export const interestsApi = {
  list: () => apiClient.get('/interests'),
};
