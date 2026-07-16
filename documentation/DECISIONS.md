# Decisions

Running log of professional decisions made while building LekkerVibes from
scratch, in case a future session (human or agent) needs to know *why*
something is the way it is. Newest entries at the top.

## 2026-07-16 — First live deployment: Laravel/MySQL replaced by Firebase + a Cloudflare Worker

Gerhard doesn't yet own `lekkervibes.co.za`, and the Laravel/MySQL backend
had never been deployed anywhere (local-only, `127.0.0.1:8000`). Rather than
wait on a domain purchase, the first live deployment ships on Cloudflare's
free generated domains, with the backend split across two services instead
of Laravel:

- **Firebase client SDK**, called directly by the frontend for
  authentication, Firestore-backed real-time group chat, and FCM push-token
  registration. No server code of ours sits in this path — Firestore
  Security Rules (`Firebase/firestore.rules`) are the authorization layer.
- **Cloudflare Worker `lekkervibes-api`** (new `Worker/` directory), for the
  handful of operations that can't be safely done from the client: admin
  role changes, moderator message deletion, and sending FCM pushes. It's a
  Hono app that verifies Firebase ID tokens with `jose` against Google's
  JWKS (Workers can't run Node's `firebase-admin` SDK — no Node APIs), then
  calls Firestore/Identity Toolkit/FCM as plain REST, authenticated via a
  service-account JWT-bearer OAuth2 exchange (also `jose`, Web Crypto only).

Scope for this pass is deliberately narrow: only auth, chat, and FCM
registration move to Firebase. Events, communities, locations, interests,
uploads, reports, blocks, saved items, and profile editing are **not**
ported — they stay on their Laravel-backed pages, which are feature-flagged
off (`FrontEnd/base44/src/lib/featureFlags.js`) and show a `ComingSoon`
placeholder in this deployment rather than erroring against a backend that
isn't running anywhere live. `BackEnd/` is not deleted — it's disconnected
from the live site, same treatment as old Base44 files get in
`BASE44_REFERENCE_MAP.md`.

This also **supersedes** the "Dropped Base44-specific auth features with no
backend equivalent" entry below: Google Sign-In is no longer a placeholder —
Firebase Authentication made it a few lines of `GoogleAuthProvider` +
`signInWithPopup`, wired into `Login.jsx`/`Register.jsx` using the
previously-unused `GoogleIcon.jsx`. It also makes `GroupChat.jsx`'s old
"Laravel Reverb is the documented upgrade path" comment moot — real-time is
Firestore's `onSnapshot` listener, no polling, no Reverb.

Firestore security rules deliberately keep the "group/community messaging
only, never 1:1 DM" constraint: `conversations` documents are
`memberIds`-gated for both read and message-create, there is no per-user
direct-message collection, and a user can only soft-delete their *own*
message — a moderator removing someone else's message must go through the
Worker's `POST /v1/moderation/messages/:conversationId/:messageId/delete`,
which authenticates as the service account and bypasses rules by design.

Deployed URLs: `https://lekkervibes.pages.dev` (Cloudflare Pages, direct
upload of a locally-built `FrontEnd/base44/dist/`, not Git-connected — see
below) and `https://lekkervibes-api.gerhard-ark-of-war.workers.dev` (Worker,
`*.workers.dev` subdomain, no custom route configured). Attaching
`lekkervibes.co.za`/`api.lekkervibes.co.za` later is a config change
(`wrangler.toml` routes block + `ALLOWED_ORIGINS`/`VITE_API_BASE_URL`), not
an architecture change.

**Open item, not resolved in this pass:** the Cloudflare Pages project was
created via `wrangler pages project create` + `wrangler pages deploy`
(direct upload), *not* connected to the `Gerhard29046/LekkerVibes` GitHub
repo via Cloudflare's Git integration. That means `VITE_*` env vars are
baked into the bundle at local build time from `FrontEnd/base44/.env.local`
(gitignored) — the Production/Preview environment variable fields in the
Cloudflare Pages dashboard have no effect on what ships **unless and until**
Gerhard connects the repo to Pages via the dashboard (a browser action),
at which point those dashboard vars would need to be populated for
Cloudflare's own build to work.

## 2026-07-15 — Removed `@base44/sdk` and `@base44/vite-plugin`; `@` alias now explicit

Once every frontend call site was migrated off the Base44 SDK (see
`BASE44_REFERENCE_MAP.md`), both packages were removed from `package.json`
and `vite.config.js`. This surfaced a hidden dependency: `@base44/vite-
plugin` was silently providing the `@` → `./src` path alias (jsconfig.json's
`paths` mapping only affects the TS language server/editor, not Vite's own
module resolution). Removing the plugin broke every `@/...` import at build
time. Fixed by adding an explicit `resolve.alias` block to `vite.config.js`.
Side benefit: the production bundle dropped from ~654KB to ~538KB. Package
renamed from `base44-app` to `lekkervibes-frontend` in the same pass.

## 2026-07-15 — Dropped Base44-specific auth features with no backend equivalent

Email-OTP registration verification and "Continue with Google" were both
Base44-platform features with no Laravel-side implementation decided yet.
Rather than fake them or block the migration on building them, `Register.jsx`
now registers directly (no OTP step) and the Google buttons were removed
from `Login.jsx`/`Register.jsx`. Revisit once/if OAuth is prioritized —
`GoogleIcon.jsx` was left in place (unused) for that.

## 2026-07-15 — Optional auth on public GET routes: `$request->user('sanctum')`, not `$request->user()`

Public browsing routes (`GET /api/events`, `/api/events/{event}`, and every
other public list/detail endpoint) are **not** wrapped in `auth:sanctum`
middleware — a guest must be able to hit them. But a logged-in user sends a
Bearer token anyway and expects personalization (`saved_by_me`,
`my_attendance_status`, a `mine=1` filter). Plain `$request->user()` resolves
against the app's *default* guard (`web`, session-based) and is `null` even
with a valid Bearer token, because no `auth:sanctum` middleware ran to
switch the default guard for the request. **Fix: call
`$request->user('sanctum')` explicitly** — this queries the Sanctum guard
directly regardless of middleware, returning the token's user if present or
null for guests, without ever aborting the request. Route handlers under
`auth:sanctum` middleware can keep using plain `$request->user()` since the
middleware already resolved it — but resource classes and any shared code
that might run on both public and protected routes should use the explicit
`'sanctum'` guard name to be correct either way. Found and fixed via live
testing of `saved_by_me` returning `false` for an authenticated request.

## 2026-07-15 — `communities.member_count` is maintained by the API layer, not the database

It's a denormalized counter (avoids a `COUNT(*)` on `community_members` on
every community list render). Nothing enforces it automatically — no DB
trigger, no model observer yet. **Whoever implements the memberships API
(join/leave/approve/reject) must increment/decrement it there.**
`DemoDataSeeder` recomputes it manually after inserting seed membership rows
since it bypasses that API layer. If a model-level solution (an `Eloquent`
observer on `CommunityMember` create/update/delete) turns out cleaner once
the memberships API exists, switch to that instead — just don't leave two
mechanisms fighting each other.

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
