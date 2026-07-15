import { apiClient } from '@/api/apiClient';

export const uploadsApi = {
  upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/uploads', formData);
  },
};
