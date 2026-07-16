import { Hono } from 'hono';
import type { Env, Variables } from '../types/env';

export const healthRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

healthRoute.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'lekkervibes-api', timestamp: new Date().toISOString() });
});
