import { getAccessToken } from './gcpAuth';
import type { Env } from '../types/env';

export interface FcmSendResult {
  ok: boolean;
  status: number;
  body: string;
}

// Sends a single push notification via the FCM HTTP v1 API. This is a
// manually-invoked capability this pass (called from POST
// /v1/notifications/send) — nothing automatically fires it yet, since
// wiring it to "new chat message" would need either a Firestore-triggered
// Cloud Function (excluded) or a Cron Trigger polling Firestore (extra
// scope not requested).
export async function sendFcmMessage(
  env: Env,
  token: string,
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<FcmSendResult> {
  const accessToken = await getAccessToken(env);
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification,
          data,
        },
      }),
    },
  );

  return { ok: response.ok, status: response.status, body: await response.text() };
}
