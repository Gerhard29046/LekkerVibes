import { apiClient } from '@/api/apiClient';

export const savedApi = {
  list: () => apiClient.get('/saved'),
};
