import { cors } from 'hono/cors';
import type { Env } from '../types/env';

// Allow-list driven entirely by env.ALLOWED_ORIGINS (comma-separated), so
// attaching a custom domain later (or swapping the pages.dev hostname) is a
// wrangler.toml edit + redeploy, never a code change.
export function corsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const env = c.env as Env;
      const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
      return origin && allowed.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });
}
