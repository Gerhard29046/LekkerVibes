import { getAccessToken } from './gcpAuth';
import type { Env } from '../types/env';

// Thin wrapper over the Firestore REST API v1, authenticated as the service
// account. This deliberately bypasses Firestore security rules — that's the
// point: it's only used for the specific trusted operations that a client
// can't safely perform under the rules in Firebase/firestore.rules (e.g. a
// moderator deleting someone else's message).

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function baseUrl(env: Env): string {
  return `https://firestore.googleapis.com/v1/projects/${env.GCP_PROJECT_ID}/databases/(default)/documents`;
}

export function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

export function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(Math.trunc(value)) };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

export function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  return null;
}

export function fromFirestoreDocument(doc: { fields?: Record<string, FirestoreValue> }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    out[k] = fromFirestoreValue(v);
  }
  return out;
}

async function authedFetch(env: Env, url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken(env);
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function getDocument(env: Env, path: string): Promise<Record<string, unknown> | null> {
  const response = await authedFetch(env, `${baseUrl(env)}/${path}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore get failed: ${response.status} ${await response.text()}`);
  const doc = await response.json<{ fields?: Record<string, FirestoreValue> }>();
  return fromFirestoreDocument(doc);
}

export async function patchDocument(
  env: Env,
  path: string,
  fields: Record<string, unknown>,
  updateMask: string[],
): Promise<void> {
  const mask = updateMask.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const response = await authedFetch(env, `${baseUrl(env)}/${path}?${mask}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: toFirestoreFields(fields) }),
  });
  if (!response.ok) throw new Error(`Firestore patch failed: ${response.status} ${await response.text()}`);
}

export async function runQuery(
  env: Env,
  structuredQuery: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> {
  const response = await authedFetch(env, `${baseUrl(env)}:runQuery`, {
    method: 'POST',
    body: JSON.stringify({ structuredQuery }),
  });
  if (!response.ok) throw new Error(`Firestore query failed: ${response.status} ${await response.text()}`);
  const rows = await response.json<Array<{ document?: { fields?: Record<string, FirestoreValue> } }>>();
  return rows.filter((r) => r.document).map((r) => fromFirestoreDocument(r.document!));
}

// Same as runQuery, but also returns each match's document path (relative
// to the documents root) so callers can act on the document itself, not
// just its fields — e.g. deleting a stale FCM token doc found via a
// collection-group query without already knowing which user owns it.
export async function runQueryWithPaths(
  env: Env,
  structuredQuery: Record<string, unknown>,
): Promise<Array<{ path: string; data: Record<string, unknown> }>> {
  const response = await authedFetch(env, `${baseUrl(env)}:runQuery`, {
    method: 'POST',
    body: JSON.stringify({ structuredQuery }),
  });
  if (!response.ok) throw new Error(`Firestore query failed: ${response.status} ${await response.text()}`);
  const rows = await response.json<Array<{ document?: { name: string; fields?: Record<string, FirestoreValue> } }>>();
  // Firestore's `document.name` is the internal resource name
  // (`projects/{p}/databases/(default)/documents/{path}`), NOT the HTTPS
  // REST URL `baseUrl()` builds — strip that prefix, not the URL one.
  const prefix = `projects/${env.GCP_PROJECT_ID}/databases/(default)/documents/`;
  return rows
    .filter((r) => r.document)
    .map((r) => ({
      path: r.document!.name.replace(prefix, ''),
      data: fromFirestoreDocument(r.document!),
    }));
}

export async function deleteDocument(env: Env, path: string): Promise<void> {
  const response = await authedFetch(env, `${baseUrl(env)}/${path}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Firestore delete failed: ${response.status} ${await response.text()}`);
  }
}
