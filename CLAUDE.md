# LekkerVibes

South African location-aware activity, event and community platform. *"Find
your people. Find your place. Find your vibe."* Not a dating app, hotel
site, nightclub-only platform, or generic ticket marketplace.

This is a **new build from scratch**. The React code under
`FrontEnd/base44/` originated as a Base44 (hosted low-code platform) export
and was used as a visual/component reference — **zero runtime Base44
dependency achieved**: `@base44/sdk` and `@base44/vite-plugin` are fully
removed. See `documentation/BASE44_REFERENCE_MAP.md`.

## Architecture

```
React + Vite (FrontEnd/base44/)
  ├─ Firebase JS SDK (Auth, Firestore, Cloud Messaging) → Firebase project lekkervibes-lvid001
  └─ Cloudflare Worker "lekkervibes-api" (trusted ops: admin/moderation/FCM send)
```

Live: `https://lekkervibes.pages.dev` (Cloudflare Pages) and
`https://lekkervibes-api.gerhard-ark-of-war.workers.dev` (Worker) — free
Cloudflare-generated domains, no purchased domain yet. The Laravel 13 +
MySQL backend (`BackEnd/`) is **disconnected from this live deployment**
(never actually deployed anywhere — local-only) but not deleted; see
`documentation/DECISIONS.md` (2026-07-16 entry) for the full pivot rationale
and `documentation/FEATURE_STATUS.md` for exactly what's live vs.
feature-flagged off pending a future Firestore data-model expansion.

Full detail: `documentation/ARCHITECTURE.md`. Schema: `documentation/
DATABASE.md`. API contract: `documentation/API.md`. Decisions log:
`documentation/DECISIONS.md`. Setup: `documentation/LOCAL_SETUP.md`.
Feature status: `documentation/FEATURE_STATUS.md`.

## Active paths

- Frontend: `FrontEnd/base44/` (Vite root — `package.json`, `vite.config.js`,
  `src/` all live here)
- Worker: `Worker/` (Cloudflare Worker `lekkervibes-api`, Hono + `jose`,
  TypeScript)
- Firebase config: `Firebase/` (`firestore.rules`, `firestore.indexes.json`,
  `firebase.json`, `.firebaserc` — project `lekkervibes-lvid001`)
- Backend: `BackEnd/` (Laravel 13 — disconnected from the live deployment,
  still used for local development of the not-yet-ported features)
- Agent team: `.claude/agents/` (22 project-specific subagents — jarvis-lead
  coordinates, delegates to the rest)

## Database

MySQL 8.4 at `127.0.0.1:3307`, database **`lekkervibes`**.

**Safety rule: `cap_dashboard` on the same MySQL server belongs to an
unrelated application. Never create, drop, alter, seed, or query it for
anything LekkerVibes-related. Always verify the selected database is
exactly `lekkervibes` before any destructive operation.**

## Setup & test commands

See `documentation/LOCAL_SETUP.md` and `documentation/TESTING.md` for full
detail. Quick reference:

```powershell
# PHP/Composer/MySQL aren't on PATH by default:
$env:PATH = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:PATH

cd BackEnd; php artisan serve --host=127.0.0.1 --port=8000
cd FrontEnd/base44; npm run dev
```

## Coding conventions

- Backend (Laravel, disconnected from live deployment but still used
  locally for not-yet-ported features): standard Laravel conventions,
  PHP 8 attribute-based model config (`#[Fillable]`, `#[Hidden]` — see
  `app/Models/User.php`), Form Requests for validation, API Resources for
  response shaping, Policies for authorization. No business logic in
  controllers beyond orchestration.
- Frontend: `@/` alias → `FrontEnd/base44/src/*` (configured directly in
  `vite.config.js` `resolve.alias`). One `src/api/<domain>Api.js` module per
  resource domain. `src/lib/featureFlags.js` gates any page/section still
  backed by the disconnected Laravel API — check it before assuming a
  `*Api.js` module (other than `messagesApi.js`, which is Firestore-backed
  now) is reachable from a live page. `@tanstack/react-query` is installed
  and a `QueryClientProvider` wraps the app, but pages currently fetch via
  plain `useState`/`useEffect`, not `useQuery`/`useMutation` — migrating to
  TanStack Query hooks is a worthwhile follow-up, not done yet.
- Auth: **Firebase Authentication** (Email/Password + Google), via
  `src/lib/AuthContext.jsx` wrapping the Firebase JS SDK — not Sanctum, see
  `documentation/DECISIONS.md` (2026-07-16 entry) for why. The Cloudflare
  Worker verifies Firebase ID tokens for its own trusted endpoints; it does
  not issue or manage sessions itself.
- Cloudflare Worker (`Worker/`): Hono + `jose`, TypeScript. No
  `firebase-admin`/`google-auth-library` — Workers can't run their Node
  APIs; trusted-op REST calls to Firestore/Identity Toolkit/FCM authenticate
  via a service-account JWT-bearer OAuth2 exchange instead (`Worker/src/lib/
  gcpAuth.ts`).
- Messaging is group/community-based only — never build unrestricted 1:1
  direct messaging. Firestore rules enforce this structurally
  (`memberIds`-gated `conversations`, no per-user DM collection).

## Visual system

Coastal Community aesthetic — alive, warm, modern, youthful, premium, local,
outdoorsy, safe. Palette: `#164E63` `#0F766E` `#7DD3FC` `#F97366` `#FDBA8C`
`#F7F1E8` `#FFFDF8` `#65A30D` `#1F2933`. Motion (sliding nav, animated
drawers, bottom sheets, page transitions, scroll reveals, skeleton loaders)
must respect `prefers-reduced-motion` and stay performant.

## Current milestone

LekkerVibes has its **first live deployment** (2026-07-16): Firebase
Authentication (Email/Password + Google), Firestore-backed real-time group
chat, FCM push notifications (client registration + Worker-side send with
stale-token cleanup), and the Cloudflare Worker `lekkervibes-api`'s trusted
endpoints (admin bootstrap/role changes, moderator message deletion) are
all live and tested end-to-end against the real deployed services — see
`documentation/DECISIONS.md` for the pivot rationale. This is a deliberately
**narrow** scope: events, communities, locations, interests, uploads,
reports, blocks, saved items, and profile editing are still Laravel-backed
and are feature-flagged off (`src/lib/featureFlags.js`) in this deployment,
showing a `ComingSoon` placeholder — porting them to Firestore + the Worker
is the next major phase, not done yet. See `documentation/FEATURE_STATUS.md`
for the authoritative per-feature status — do not assume anything not
listed there as ✅ actually works.

Also outstanding: the `/app/*` signed-in app shell from the product brief
(current signed-in pages live at top-level routes, not under a bottom-nav
`/app` shell), and connecting the Cloudflare Pages project to GitHub for
automatic redeploys on push (currently a manual `wrangler pages deploy` of a
local build — see `documentation/DECISIONS.md`'s open item).

## Known limitations

- The narrow-scope pivot above means most of the product (events,
  communities, locations, etc.) has no live backend right now — it's
  disabled in the UI, not broken, but not usable either. Full list in
  `documentation/FEATURE_STATUS.md`.
- No automated test suite (backend Pest/PHPUnit or frontend Vitest/
  Playwright) — see `documentation/FEATURE_STATUS.md` for what was
  live-tested instead (including the new Firebase/Worker deployment, tested
  via direct Identity Toolkit/Firestore/Worker REST calls, not a browser).
- FCM push sending is a working, manually-invoked Worker capability
  (`POST /v1/notifications/send`) — nothing automatically triggers it yet
  (e.g. on a new chat message); that needs either a Cloud Function
  (excluded by design) or a Worker Cron Trigger, neither built this pass.
- Broader moderation actions (warn/mute/ban) and organiser-verification
  processing have no Worker endpoints yet — no product flow calls them
  since organiser signup isn't part of this narrow scope.
- Blocking is recorded but not enforced (Laravel-side, disconnected); no
  recurring-event occurrence generation; no venue-creation flow. Full list
  in `documentation/FEATURE_STATUS.md`.

## File deletion policy

Never delete existing source files, components, pages, or config without
Gerhard's explicit approval. Obsolete files get disconnected from runtime,
marked deprecated in `documentation/BASE44_REFERENCE_MAP.md` or
`FEATURE_STATUS.md`, and left in place pending approval. Generated/
disposable output (`node_modules`, `vendor`, `dist`, framework caches) is
not subject to this rule.
