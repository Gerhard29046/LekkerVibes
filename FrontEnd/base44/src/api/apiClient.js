const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const TOKEN_STORAGE_KEY = 'lekkervibes_token';

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || null;
  }
}

/**
 * Thin fetch wrapper: injects the Bearer token, builds query strings,
 * normalizes error responses into ApiError, and unwraps `{ data: ... }`
 * envelopes automatically unless `raw: true` is passed.
 */
export async function apiRequest(path, { method = 'GET', body, params, raw = false, signal } = {}) {
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const isFormData = body instanceof FormData;
  const headers = { Accept: 'application/json' };
  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    signal,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || `Request failed (${response.status})`, {
      status: response.status,
      errors: payload?.errors,
    });
  }

  if (raw) return payload;
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
}

export const apiClient = {
  get: (path, params, signal) => apiRequest(path, { method: 'GET', params, signal }),
  post: (path, body, params) => apiRequest(path, { method: 'POST', body, params }),
  put: (path, body, params) => apiRequest(path, { method: 'PUT', body, params }),
  delete: (path, params) => apiRequest(path, { method: 'DELETE', params }),
  raw: (path, options) => apiRequest(path, { ...options, raw: true }),
};
