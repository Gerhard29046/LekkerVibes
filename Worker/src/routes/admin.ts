import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth';
import { runQuery, patchDocument } from '../lib/firestoreRest';
import { setUserRoleClaim } from '../lib/identityToolkit';
import type { Env, Role, Variables } from '../types/env';

export const adminRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

const VALID_ROLES: Role[] = ['member', 'moderator', 'admin'];

// One-shot: creates the very first admin. Nothing in the old Laravel app
// ever built admin assignment either (schema-only, per BackEnd research),
// so there is no "first admin" to inherit — this bootstraps one, gated by a
// Worker secret only Gerhard knows, and refuses once any admin exists.
adminRoute.post('/admin/bootstrap', async (c) => {
  const secretHeader = c.req.header('X-Bootstrap-Secret');
  if (!secretHeader || secretHeader !== c.env.ADMIN_BOOTSTRAP_SECRET) {
    return c.json({ message: 'Forbidden' }, 403);
  }

  const body = await c.req.json<{ uid?: string }>().catch(() => ({}) as { uid?: string });
  if (!body.uid) {
    return c.json({ message: 'uid is required' }, 400);
  }

  const existingAdmins = await runQuery(c.env, {
    from: [{ collectionId: 'users' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'role' },
        op: 'EQUAL',
        value: { stringValue: 'admin' },
      },
    },
    limit: 1,
  });

  if (existingAdmins.length > 0) {
    return c.json({ message: 'An admin already exists; bootstrap is one-shot only' }, 409);
  }

  await setUserRoleClaim(c.env, body.uid, 'admin');
  await patchDocument(c.env, `users/${body.uid}`, { role: 'admin' }, ['role']);

  return c.json({ uid: body.uid, role: 'admin' });
});

// Ongoing role changes, once an admin exists.
adminRoute.post('/admin/users/:uid/role', requireAuth, requireRole('admin'), async (c) => {
  const targetUid = c.req.param('uid');
  const body = await c.req.json<{ role?: string }>().catch(() => ({}) as { role?: string });

  if (!targetUid) {
    return c.json({ message: 'uid path parameter is required' }, 400);
  }
  if (!body.role || !VALID_ROLES.includes(body.role as Role)) {
    return c.json({ message: `role must be one of ${VALID_ROLES.join(', ')}` }, 400);
  }

  const role = body.role as Role;
  await setUserRoleClaim(c.env, targetUid, role);
  await patchDocument(c.env, `users/${targetUid}`, { role }, ['role']);

  return c.json({ uid: targetUid, role });
});
