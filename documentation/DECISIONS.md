# Decisions

Running log of professional decisions made while building LekkerVibes from
scratch, in case a future session (human or agent) needs to know *why*
something is the way it is. Newest entries at the top.

## 2026-07-15 — Repository restructure: consolidate frontend into `FrontEnd/base44/`

The repo arrived with the Base44 export split across two locations: config/
entrypoint files (`package.json`, `vite.config.js`, `index.html`, `App.jsx`,
`main.jsx`, etc.) at the repo root, and the actual `src/` tree already moved
to `FrontEnd/src/`, with `FrontEnd/base44/` holding only `config.jsonc` and
`entities/*.jsonc`. This meant the project didn't build from either location
(`index.html` expected `/src/main.jsx`, which existed nowhere).

**Decision:** moved everything into a single `FrontEnd/base44/` tree (config
files at its root, `App.jsx`/`main.jsx`/`index.css` under `FrontEnd/base44/
src/`, matching the `@/` → `./src/*` alias and `index.html`'s entrypoint).
Verified `npm install` and `npm run build` succeed from that location. A git
repo was initialized first and the original scattered state committed as a
baseline snapshot, so this move is fully reversible.

## 2026-07-15 — Auth transport: Sanctum personal access tokens (Bearer), not cookie/SPA auth

Laravel Sanctum supports two modes: cookie-based "SPA authentication" (same
top-level domain, CSRF-protected) or token-based API authentication (Bearer
token in `Authorization` header). Given the frontend (`127.0.0.1:5173`) and
backend (`127.0.0.1:8000`) run on different ports during local dev, and the
production topology isn't finalized, **token-based auth was chosen** —
`POST /api/auth/login` returns a personal access token, the frontend stores
it and sends `Authorization: Bearer <token>` on every request. This avoids
CSRF/cookie-domain complexity now and works unchanged if frontend and
backend end up on different domains in production. CORS is still locked to
known frontend origins via `CORS_ALLOWED_ORIGINS` for defense in depth, even
though credentials aren't used.

## 2026-07-15 — Real-time messaging: deferred, polling for MVP

The Base44 export's `GroupChat.jsx` used `base44.entities.GroupMessage.
subscribe()` for live message push. The new backend has no real-time
transport decided yet. **Decision:** ship MVP group chat with short-interval
polling (TanStack Query `refetchInterval`) against `GET /api/conversations/
{id}/messages`, and document Laravel Reverb (first-party, no third-party
dependency) as the upgrade path once the product needs true real-time
delivery. Do not build a custom WebSocket server for v1.

## 2026-07-15 — `community_roles` table: per-community permission overrides, not the source of truth for role tier

`community_members.role` (enum: member/moderator/organiser) is the source of
truth for which of the three fixed tiers a member holds — it's indexed and
simple to query. `community_roles` exists *in addition* to let a community
customise what each tier is allowed to do (custom label, `can_manage_
members`, `can_manage_events`, `can_post_announcements`) without needing a
full custom-RBAC system. A community with no `community_roles` rows just
uses sensible hardcoded defaults per tier in application code.

## 2026-07-15 — `community_activities` is a cross-link, not primary ownership

`events.community_id` is an event's primary organising community (nullable —
independent organisers can run events with no community at all).
`community_activities` is a separate many-to-many pivot for a community
*cross-promoting* an event it doesn't primarily own (e.g. a partner event).
Most events will only ever have the direct `community_id` relationship; the
pivot table is for the secondary "also shown in this community's feed" case.

## 2026-07-15 — No `community_saves` / bookmarking table for v1

The product spec's "saved" concept is fully covered by `event_saves`
(bookmark an event) and the existing join/request-to-join flow for
communities (a user either is or isn't a member — there's no separate
"save a community for later" behaviour requested). Not building a
`community_saves` table until there's a concrete product need for it.

## 2026-07-15 — `notifications` table uses Laravel's built-in polymorphic schema

Rather than a custom `notifications` table+model, the standard Laravel
`Notifiable`/`DatabaseNotification` schema (`uuid` PK, `type`, polymorphic
`notifiable_type`/`notifiable_id`, `data` JSON blob, `read_at`) is used. This
gets `php artisan make:notification`, the `database` channel, and
`$user->notifications` for free, and covers every notification type listed
in the product spec (event reminders, community updates, messages,
membership decisions, moderation notices) via different `type` values and
`data` payloads rather than separate tables per notification kind.

## 2026-07-15 — `lekkervibes` database reset

Per explicit pre-authorization in the project brief, the pre-existing
`lekkervibes` MySQL database (host `127.0.0.1:3307`) — belonging to an
abandoned earlier attempt with a much smaller schema (users, events,
locations, interests, venues, event_categories, event_occurrences,
user_profiles, user_saved_areas, user_transport_preferences only) — was
exported to `documentation/db-archive/lekkervibes_old_backup_2026-07-15.sql`
for reference, then dropped and recreated empty (`utf8mb4_unicode_ci`).
`cap_dashboard` (a separate, unrelated application's database on the same
MySQL server) was verified untouched before and after. The new schema was
designed from first principles per the product spec rather than preserving
the old one — see `DATABASE.md`.
