import { apiClient } from '@/api/apiClient';

export const reportsApi = {
  create: ({ reportableType, reportableId, reason, details }) =>
    apiClient.post('/reports', {
      reportable_type: reportableType,
      reportable_id: reportableId,
      reason,
      details,
    }),
};
