import type { Env } from '../types/env';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.currentOpeningHours.openNow',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
  'places.primaryType',
  'places.businessStatus',
  'nextPageToken',
].join(',');

export interface PlaceResult {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  currentOpeningHours?: { openNow?: boolean };
  websiteUri?: string;
  googleMapsUri?: string;
  primaryTypeDisplayName?: { text?: string };
  primaryType?: string;
  businessStatus?: string;
}

interface SearchTextParams {
  textQuery: string;
  pageToken?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

// Places API (New) Text Search — used for every category here since the
// product spec's own category queries ("Running clubs in George, Western
// Cape", "Hiking trails near...", etc.) are all natural-language, not
// fixed Places `included_type` enums. See Worker/src/routes/discover.ts.
export async function searchTextPlaces(env: Env, params: SearchTextParams) {
  const body: Record<string, unknown> = { textQuery: params.textQuery };
  if (params.pageToken) body.pageToken = params.pageToken;
  if (params.latitude != null && params.longitude != null) {
    body.locationBias = {
      circle: {
        center: { latitude: params.latitude, longitude: params.longitude },
        radius: params.radiusMeters ?? 20000,
      },
    };
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Places searchText failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { places?: PlaceResult[]; nextPageToken?: string };
  return { places: data.places ?? [], nextPageToken: data.nextPageToken };
}

// Streams a Places photo through the Worker so the API key never appears in
// a URL the browser makes requests to directly (see the "never expose it
// through a VITE variable or frontend source file" requirement — the same
// principle applies to it leaking via an <img src> query string).
export async function fetchPlacePhoto(env: Env, photoName: string, maxWidthPx: number) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${env.GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Google Places photo fetch failed (${res.status})`);
  return res;
}
