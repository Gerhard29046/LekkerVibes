import { Hono } from 'hono';
import { runQueryWithPaths, getDocument } from '../lib/firestoreRest';
import type { Env, Variables } from '../types/env';

export const eventsRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// Invite-link events are deliberately unreadable via a plain client
// Firestore query/get unless the caller is already the host or an attendee
// (see Firebase/firestore.rules) — a security rule can only see
// resource.data and request.auth, never "did this query supply the right
// token," so a rule permissive enough to let the correct token through
// would also let a bare, unfiltered query enumerate every invite-link
// event ever created. This endpoint is the one place that can safely
// compare a caller-supplied token against the stored value using the
// service account (bypasses rules), and it returns only enough to preview
// and decide whether to join — never the full event document.
eventsRoute.get('/events/resolve-invite', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ message: 'token is required' }, 400);

  const matches = await runQueryWithPaths(c.env, {
    from: [{ collectionId: 'events' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          { fieldFilter: { field: { fieldPath: 'inviteToken' }, op: 'EQUAL', value: { stringValue: token } } },
          { fieldFilter: { field: { fieldPath: 'visibility' }, op: 'EQUAL', value: { stringValue: 'invite_link' } } },
        ],
      },
    },
    limit: 1,
  });

  const match = matches[0];
  if (!match) return c.json({ message: 'This invite link is invalid or has expired.' }, 404);

  const id = match.path.split('/').pop();
  const event = match.data;
  if (event.status === 'cancelled') {
    return c.json({ message: 'This event has been cancelled.' }, 410);
  }

  const organiser = event.organiserId ? await getDocument(c.env, `users/${event.organiserId}`) : null;

  return c.json({
    id,
    title: event.title ?? null,
    placeName: event.placeName ?? null,
    placePhotoUrl: event.placePhotoUrl ?? null,
    date: event.date ?? null,
    startTime: event.startTime ?? null,
    capacity: event.capacity ?? null,
    organiserName: organiser?.displayName ?? 'Organiser',
  });
});
