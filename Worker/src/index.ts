import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { healthRoute } from './routes/health';
import { adminRoute } from './routes/admin';
import { moderationRoute } from './routes/moderation';
import { notificationsRoute } from './routes/notifications';
import { discoverRoute } from './routes/discover';
import type { Env, Variables } from './types/env';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('/v1/*', corsMiddleware());

// Firestore/Identity Toolkit/FCM REST calls throw on unexpected upstream
// responses (e.g. a role-change target uid that doesn't exist in Firebase
// Auth) — surface those as a clean 502 instead of a bare 500 with no body.
app.onError((err, c) => {
  console.error(err);
  return c.json({ message: 'Upstream request failed', detail: err.message }, 502);
});

const v1 = new Hono<{ Bindings: Env; Variables: Variables }>();
v1.route('/', healthRoute);
v1.route('/', adminRoute);
v1.route('/', moderationRoute);
v1.route('/', notificationsRoute);
v1.route('/', discoverRoute);

app.route('/v1', v1);

export default {
  fetch: app.fetch,

  // Placeholder for future scheduled/protected operations — e.g. syncing
  // `external_event_sources` (schema-only in the old Laravel app, never
  // implemented there either). Not built out this pass: there's no real
  // partner integration target defined yet, and wiring a Cron Trigger for
  // nothing to actually sync would be speculative. To activate, add a
  // `[triggers] crons = [...]` block to wrangler.toml.
  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    // Intentionally empty.
  },
};
