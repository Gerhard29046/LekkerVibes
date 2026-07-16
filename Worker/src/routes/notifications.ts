import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth';
import { sendFcmMessage } from '../lib/fcm';
import { runQueryWithPaths, deleteDocument } from '../lib/firestoreRest';
import type { Env, Variables } from '../types/env';

export const notificationsRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// A token FCM reports as unregistered/invalid is stale (uninstalled app,
// cleared site data, revoked permission, etc.) — find and remove its
// fcmTokens doc via a collection-group query, since the send request only
// carries the token value, not which user it belongs to.
async function removeStaleToken(env: Env, token: string): Promise<void> {
  const matches = await runQueryWithPaths(env, {
    from: [{ collectionId: 'fcmTokens', allDescendants: true }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'token' },
        op: 'EQUAL',
        value: { stringValue: token },
      },
    },
  });
  await Promise.all(matches.map((m) => deleteDocument(env, m.path)));
}

const STALE_TOKEN_ERROR_CODES = ['UNREGISTERED', 'INVALID_ARGUMENT'];

// Manually-invoked FCM send. Nothing auto-fires this yet — see the note in
// lib/fcm.ts on why automatic dispatch (e.g. on new chat message) is out of
// scope for this pass.
notificationsRoute.post('/notifications/send', requireAuth, requireRole('moderator'), async (c) => {
  type SendBody = { token?: string; title?: string; body?: string; data?: Record<string, string> };
  const body = await c.req.json<SendBody>().catch(() => ({}) as SendBody);

  if (!body.token || !body.title || !body.body) {
    return c.json({ message: 'token, title, and body are required' }, 400);
  }

  const result = await sendFcmMessage(c.env, body.token, { title: body.title, body: body.body }, body.data);

  if (!result.ok) {
    const errorCode = /"errorCode":\s*"([A-Z_]+)"/.exec(result.body)?.[1];
    if (errorCode && STALE_TOKEN_ERROR_CODES.includes(errorCode)) {
      await removeStaleToken(c.env, body.token).catch(() => {});
      return c.json({ message: 'Token invalid — removed', status: result.status }, 410);
    }
    return c.json({ message: 'FCM send failed', status: result.status, detail: result.body }, 502);
  }

  return c.json({ sent: true });
});
