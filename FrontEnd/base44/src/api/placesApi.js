import { apiClient } from '@/api/apiClient';

// Client for the Worker's /v1/places/* routes (Worker/src/routes/places.ts)
// — a general-purpose Google Places (New) search surface for the Cape Town
// homepage's restaurants/galleries/culture sections, separate from
// discoverApi.js's mood/category-template search used by the main Discover
// page. Same underlying Google client and edge-cache strategy on the Worker
// side; this just exposes plain "search near this city" queries.
export const placesApi = {
  textSearch: (query, { city, pageToken, signal } = {}) =>
    apiClient.raw('/places/text-search', { params: { query, city, pageToken }, signal }),

  nearbySearch: ({ latitude, longitude, radiusKm, type, signal } = {}) =>
    apiClient.raw('/places/nearby-search', { params: { latitude, longitude, radiusKm, type }, signal }),

  details: (placeId, signal) => apiClient.raw(`/places/${placeId}`, { signal }),
};

// Builds a same-origin-relative Worker photo URL, matching discoverApi.js's
// placePhotoUrl — the photo path already comes back as `/v1/places/photo?
// name=...` from the Worker, so this is just resolving it against the
// configured API base.
export function placesPhotoUrl(photoPath) {
  if (!photoPath) return null;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787/v1').replace(/\/$/, '');
  return `${base}${photoPath.replace(/^\/v1/, '')}`;
}
