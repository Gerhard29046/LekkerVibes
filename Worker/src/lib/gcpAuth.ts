import { SignJWT, importPKCS8 } from 'jose';
import type { Env } from '../types/env';

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

// Cached per Worker isolate — avoids minting a new token on every request.
// Isolates are short-lived and per-request-concurrent, so a module-scope
// variable is safe here (no cross-request races within one isolate).
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

async function mintAccessToken(env: Env): Promise<{ accessToken: string; expiresAt: number }> {
  const serviceAccount: ServiceAccount = JSON.parse(env.GCP_SERVICE_ACCOUNT_JSON);
  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');

  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience(serviceAccount.token_uri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mint GCP access token: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json<{ access_token: string; expires_in: number }>();
  return {
    accessToken: payload.access_token,
    // Refresh a little early to avoid using a token that expires mid-request.
    expiresAt: now + payload.expires_in - 60,
  };
}

export async function getAccessToken(env: Env): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > nowSeconds) {
    return cachedToken.accessToken;
  }
  cachedToken = await mintAccessToken(env);
  return cachedToken.accessToken;
}
