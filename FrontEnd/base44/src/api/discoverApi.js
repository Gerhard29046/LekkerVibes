import { apiClient } from '@/api/apiClient';

// Google Places (New) discovery, proxied through the Cloudflare Worker —
// see Worker/src/routes/discover.ts. The Worker holds the API key; nothing
// here ever touches it directly.
export const discoverApi = {
  search: (params, signal) => apiClient.raw('/discover', { params, signal }),
};

// Builds a same-origin-relative Worker URL for a Places photo, proxied so
// the API key never appears in a browser-visible <img> URL.
export function placePhotoUrl(photoPath) {
  if (!photoPath) return null;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787/v1').replace(/\/$/, '');
  return `${base}${photoPath.replace(/^\/v1/, '')}`;
}
