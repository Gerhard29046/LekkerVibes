import { apiClient } from '@/api/apiClient';

/**
 * Covers both /api/events and the /api/activities alias — the backend
 * serves the same resource under both paths (see documentation/API.md).
 */
export const eventsApi = {
  list: (params) => apiClient.raw('/events', { params }),
  get: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  remove: (id) => apiClient.delete(`/events/${id}`),
  save: (id) => apiClient.post(`/events/${id}/save`),
  unsave: (id) => apiClient.delete(`/events/${id}/save`),
  joinOccurrence: (occurrenceId, status = 'going') =>
    apiClient.post(`/events/occurrences/${occurrenceId}/join`, { status }),
  leaveOccurrence: (occurrenceId) => apiClient.post(`/events/occurrences/${occurrenceId}/leave`),
};

export const activitiesApi = eventsApi;
export const eventCategoriesApi = {
  list: () => apiClient.get('/event-categories'),
};
