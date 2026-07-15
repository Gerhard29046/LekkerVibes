import { apiClient } from '@/api/apiClient';

export const messagesApi = {
  conversations: () => apiClient.get('/conversations'),
  conversation: (id) => apiClient.get(`/conversations/${id}`),
  markConversationRead: (id) => apiClient.post(`/conversations/${id}/read`),
  list: (conversationId, params) => apiClient.get(`/conversations/${conversationId}/messages`, params),
  send: (conversationId, body) => apiClient.post(`/conversations/${conversationId}/messages`, { body }),
  remove: (messageId) => apiClient.delete(`/messages/${messageId}`),
};
