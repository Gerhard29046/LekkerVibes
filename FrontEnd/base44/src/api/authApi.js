import { apiClient, apiRequest, setToken, getToken } from '@/api/apiClient';

export const authApi = {
  async register({ name, email, password, password_confirmation, phone }) {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password, password_confirmation, phone },
      raw: true,
    });
    setToken(result.token);
    return result.user;
  },

  async login({ email, password, device_name }) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password, device_name },
      raw: true,
    });
    setToken(result.token);
    return result.user;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setToken(null);
    }
  },

  async me() {
    const result = await apiRequest('/auth/me', { raw: true });
    return result.user;
  },

  isAuthenticated() {
    return Boolean(getToken());
  },

  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword({ token, email, password, password_confirmation }) {
    return apiClient.post('/auth/reset-password', { token, email, password, password_confirmation });
  },
};
