import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Env, Role } from '../types/env';

// Google's federated JWKS for Firebase ID tokens. Cached at module scope so
// the JWKS is only re-fetched when jose's internal cache expires, not on
// every request within the same Worker isolate.
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export interface VerifiedUser {
  uid: string;
  role: Role;
  payload: JWTPayload;
}

export async function verifyFirebaseIdToken(env: Env, idToken: string): Promise<VerifiedUser> {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  });

  if (!payload.sub) {
    throw new Error('Firebase ID token missing subject claim');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > Math.floor(Date.now() / 1000)) {
    throw new Error('Firebase ID token auth_time is in the future');
  }

  const role = (payload.role as Role | undefined) ?? 'member';
  return { uid: payload.sub, role, payload };
}
