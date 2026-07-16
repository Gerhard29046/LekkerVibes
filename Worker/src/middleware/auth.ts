import type { Context, Next } from 'hono';
import { verifyFirebaseIdToken } from '../lib/firebaseAuth';
import type { Env, Role, Variables } from '../types/env';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function requireAuth(c: AppContext, next: Next) {
  const header = c.req.header('Authorization');
  const idToken = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!idToken) {
    return c.json({ message: 'Missing bearer token' }, 401);
  }

  try {
    const verified = await verifyFirebaseIdToken(c.env, idToken);
    c.set('uid', verified.uid);
    c.set('role', verified.role);
  } catch {
    return c.json({ message: 'Invalid or expired token' }, 401);
  }

  await next();
}

const ROLE_RANK: Record<Role, number> = { member: 0, moderator: 1, admin: 2 };

export function requireRole(minimum: Role) {
  return async (c: AppContext, next: Next) => {
    const role = c.get('role');
    if (!role || ROLE_RANK[role] < ROLE_RANK[minimum]) {
      return c.json({ message: 'Insufficient role' }, 403);
    }
    await next();
  };
}
