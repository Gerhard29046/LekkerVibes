import { getAccessToken } from './gcpAuth';
import type { Env, Role } from '../types/env';

// Sets a custom claim on a Firebase Auth user via the Identity Toolkit
// Admin REST API. This is what makes `role` show up in that user's next
// verified ID token (payload.role), which the Worker's requireRole()
// middleware reads without a Firestore round-trip.
export async function setUserRoleClaim(env: Env, uid: string, role: Role): Promise<void> {
  const token = await getAccessToken(env);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: uid,
        customAttributes: JSON.stringify({ role }),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Identity Toolkit accounts:update failed: ${response.status} ${await response.text()}`);
  }
}
