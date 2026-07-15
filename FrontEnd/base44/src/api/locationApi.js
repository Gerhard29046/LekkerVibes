import { apiClient } from '@/api/apiClient';

export const locationApi = {
  search: (params) => apiClient.raw('/locations', { params }),
  get: (id) => apiClient.get(`/locations/${id}`),
  popular: () => apiClient.raw('/locations', { params: { popular: 1 } }),
  savedAreas: () => apiClient.get('/locations/me/saved-areas'),
  saveArea: (data) => apiClient.post('/locations/me/saved-areas', data),
  removeSavedArea: (id) => apiClient.delete(`/locations/me/saved-areas/${id}`),
};
