import { apiClient } from '@/api/apiClient';

export const profileApi = {
  get: () => apiClient.get('/profile'),
  update: (data) => apiClient.put('/profile', data),
  updatePrivacy: (data) => apiClient.put('/profile/privacy', data),
  updateNotificationPreferences: (data) => apiClient.put('/profile/notifications', data),
  updateTransportPreferences: (data) => apiClient.put('/profile/transport', data),
  syncInterests: (interestIds) => apiClient.put('/profile/interests', { interest_ids: interestIds }),
};
