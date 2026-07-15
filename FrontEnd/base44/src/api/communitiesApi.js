import { apiClient } from '@/api/apiClient';

export const communitiesApi = {
  list: (params) => apiClient.raw('/communities', { params }),
  get: (id) => apiClient.get(`/communities/${id}`),
  create: (data) => apiClient.post('/communities', data),
  update: (id, data) => apiClient.put(`/communities/${id}`, data),
  remove: (id) => apiClient.delete(`/communities/${id}`),
  members: (id) => apiClient.get(`/communities/${id}/members`),
  join: (id, message) => apiClient.post(`/communities/${id}/join`, message ? { message } : undefined),
  leave: (id) => apiClient.post(`/communities/${id}/leave`),
  membershipRequests: (id) => apiClient.get(`/communities/${id}/membership-requests`),
  approveMembershipRequest: (communityId, requestId) =>
    apiClient.post(`/communities/${communityId}/membership-requests/${requestId}/approve`),
  rejectMembershipRequest: (communityId, requestId) =>
    apiClient.post(`/communities/${communityId}/membership-requests/${requestId}/reject`),
};
