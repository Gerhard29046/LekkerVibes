import { apiClient } from '@/api/apiClient';

export const notificationsApi = {
  list: () => apiClient.raw('/notifications'),
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
};
