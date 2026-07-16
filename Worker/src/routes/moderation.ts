import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth';
import { patchDocument } from '../lib/firestoreRest';
import type { Env, Variables } from '../types/env';

export const moderationRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// Firestore security rules only let a user soft-delete their OWN message
// (see Firebase/firestore.rules) — a moderator deleting someone else's
// message can't be expressed there, so it goes through the service account
// here instead, which bypasses rules by design.
moderationRoute.post(
  '/moderation/messages/:conversationId/:messageId/delete',
  requireAuth,
  requireRole('moderator'),
  async (c) => {
    const { conversationId, messageId } = c.req.param();

    await patchDocument(
      c.env,
      `conversations/${conversationId}/messages/${messageId}`,
      { isDeleted: true, body: null },
      ['isDeleted', 'body'],
    );

    return c.json({ conversationId, messageId, isDeleted: true });
  },
);
