import { apiClient } from '@/api/apiClient';

export const blocksApi = {
  list: () => apiClient.get('/blocks'),
  block: (blockedId) => apiClient.post('/blocks', { blocked_id: blockedId }),
  unblock: (blockedId) => apiClient.delete(`/blocks/${blockedId}`),
};
