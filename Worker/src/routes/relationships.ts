import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { getDocument, commitWrites } from '../lib/firestoreRest';
import type { Env, Variables } from '../types/env';

export const relationshipsRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// Accepting a follow request must atomically: mark the request accepted,
// create both sides of the relationship, and notify the requester. A plain
// client write can't do this (Firestore rules can't see a sibling write's
// effect within the same batch — see documentation/DECISIONS.md), and
// there's no safe way to let the request-owner directly write into the
// requester's own `following` subcollection under normal rules either. This
// bypasses rules entirely as the service account, so all four writes land
// together regardless of who's online.
relationshipsRoute.post('/follow-requests/:requestId/accept', requireAuth, async (c) => {
  const { requestId } = c.req.param();
  const uid = c.get('uid');

  const request = await getDocument(c.env, `followRequests/${requestId}`);
  if (!request) return c.json({ message: 'Follow request not found' }, 404);
  if (request.toUid !== uid) return c.json({ message: 'Only the recipient can accept this request' }, 403);
  if (request.status !== 'pending') return c.json({ message: 'Request is no longer pending' }, 409);

  const fromUid = request.fromUid as string;
  const now = new Date();

  await commitWrites(c.env, [
    { type: 'update', path: `followRequests/${requestId}`, fields: { status: 'accepted', respondedAt: now }, updateMask: ['status', 'respondedAt'] },
    { type: 'set', path: `users/${uid}/followers/${fromUid}`, fields: { uid: fromUid, followedAt: now } },
    { type: 'set', path: `users/${fromUid}/following/${uid}`, fields: { uid, followedAt: now } },
    { type: 'set', path: `users/${fromUid}/notifications/${requestId}_accepted`, fields: { type: 'follow_accepted', fromUid: uid, createdAt: now, read: false } },
  ]);

  return c.json({ accepted: true, fromUid, toUid: uid });
});

// Approving a social-link reveal request atomically: mark it accepted,
// create/replace the grant with exactly the approved platform list, and
// notify the requester — same "can't do this as a plain client write"
// reasoning as follow-request acceptance above.
relationshipsRoute.post('/social-reveal-requests/:requestId/accept', requireAuth, async (c) => {
  const { requestId } = c.req.param();
  const uid = c.get('uid');
  const body = await c.req.json<{ platforms?: string[] }>().catch(() => ({}) as { platforms?: string[] });

  const request = await getDocument(c.env, `socialRevealRequests/${requestId}`);
  if (!request) return c.json({ message: 'Reveal request not found' }, 404);
  if (request.ownerUid !== uid) return c.json({ message: 'Only the profile owner can approve this request' }, 403);
  if (request.status !== 'pending') return c.json({ message: 'Request is no longer pending' }, 409);

  const requestedPlatforms = (request.requestedPlatforms as string[]) || [];
  const approvedPlatforms = (body.platforms || requestedPlatforms).filter((p) => requestedPlatforms.includes(p));
  if (approvedPlatforms.length === 0) {
    return c.json({ message: 'At least one requested platform must be approved (or decline instead)' }, 400);
  }

  const requesterUid = request.requesterUid as string;
  const now = new Date();

  await commitWrites(c.env, [
    { type: 'update', path: `socialRevealRequests/${requestId}`, fields: { status: 'accepted', respondedAt: now }, updateMask: ['status', 'respondedAt'] },
    { type: 'set', path: `socialAccess/${uid}/grants/${requesterUid}`, fields: { platforms: approvedPlatforms, grantedAt: now } },
    { type: 'set', path: `users/${requesterUid}/notifications/${requestId}_accepted`, fields: { type: 'social_access_approved', fromUid: uid, platforms: approvedPlatforms, createdAt: now, read: false } },
  ]);

  return c.json({ accepted: true, platforms: approvedPlatforms });
});

// Blocking cascades across several collections at once (follow relationship
// both directions, any pending follow/reveal requests both directions,
// social-access grants both directions) — plain client rules can't safely
// arbitrate "delete something that references two different users' data",
// so this goes through the service account too. Never notifies the blocked
// user (per spec — blocking must not expose that it happened).
relationshipsRoute.post('/users/:targetUid/block', requireAuth, async (c) => {
  const { targetUid } = c.req.param();
  const uid = c.get('uid');
  if (targetUid === uid) return c.json({ message: 'Cannot block yourself' }, 400);

  const now = new Date();
  const writes: Parameters<typeof commitWrites>[1] = [
    { type: 'set', path: `users/${uid}/blocks/${targetUid}`, fields: { uid: targetUid, blockedAt: now } },
    { type: 'delete', path: `users/${targetUid}/followers/${uid}` },
    { type: 'delete', path: `users/${uid}/following/${targetUid}` },
    { type: 'delete', path: `users/${uid}/followers/${targetUid}` },
    { type: 'delete', path: `users/${targetUid}/following/${uid}` },
    { type: 'delete', path: `followRequests/${uid}_${targetUid}` },
    { type: 'delete', path: `followRequests/${targetUid}_${uid}` },
    { type: 'delete', path: `socialRevealRequests/${uid}_${targetUid}` },
    { type: 'delete', path: `socialRevealRequests/${targetUid}_${uid}` },
    { type: 'delete', path: `socialAccess/${uid}/grants/${targetUid}` },
    { type: 'delete', path: `socialAccess/${targetUid}/grants/${uid}` },
  ];
  await commitWrites(c.env, writes);

  return c.json({ blocked: true, targetUid });
});
