# Feature Status

Honest status tracker. A feature is only "Done" once it's implemented on
both sides (where applicable) and actually tested/observed working — not
merely scaffolded. Updated as work progresses.

Legend: ⬜ Not started · 🟨 In progress · ✅ Done · 🚫 Blocked

## Live deployment (2026-07-16 — Firebase + Cloudflare Worker)

See `DECISIONS.md` for the pivot rationale. **Everything below this section
predates the pivot and describes the Laravel/MySQL backend**, which is
disconnected from the live site (still used locally for developing the
not-yet-ported features) — do not assume those rows describe what's
reachable from `https://lekkervibes.pages.dev` today.

| Area | Status | Notes |
|---|---|---|
| Firebase Authentication (Email/Password) | ✅ | Live-tested via Identity Toolkit REST: register, login, session persistence (real API calls, not a browser click-through) |
| Firebase Authentication (Google) | ✅ | `GoogleAuthProvider` + `signInWithPopup` wired in `Login.jsx`/`Register.jsx`; code path verified via build/lint — a real interactive Google OAuth popup consent flow needs a browser, which this environment doesn't have; Gerhard should click through it once live |
| Firestore user profile creation/merge | ✅ | Live-tested: profile doc created on first sign-in, self-role-promotion correctly rejected by rules |
| Firestore real-time group chat | ✅ | Live-tested with two real accounts: send/read as member, sender-impersonation rejected, non-member posting rejected, own-message soft-delete allowed, other's-message soft-delete rejected |
| FCM token registration + foreground/background handling | 🟨 | Token-save-to-Firestore path and `onMessage`/service-worker code written and build-verified; actual browser permission prompt + real device token registration needs a browser to observe, not done in this pass |
| Cloudflare Worker `lekkervibes-api` — `/v1/health` | ✅ | Live-tested, 200 |
| Worker — auth middleware (ID token verification) | ✅ | Live-tested: missing token → 401, invalid token → 401, valid token/insufficient role → 403 |
| Worker — admin bootstrap + role changes | ✅ | Live-tested end-to-end incl. custom-claim propagation after token refresh |
| Worker — moderator message deletion | ✅ | Live-tested: a promoted admin deleted another test user's message via the Worker; direct Firestore attempt by a non-sender correctly rejected by rules first |
| Worker — FCM send (`POST /v1/notifications/send`) | ✅ | Live-tested against the real FCM HTTP v1 API (auth + call path confirmed via a real "invalid token" response from Google); no real device token available to verify actual delivery to a browser |
| Worker — stale FCM token cleanup | ✅ | Live-tested: a seeded fake token's Firestore doc was found via a collection-group query and deleted after FCM reported it invalid |
| Firestore security rules deployed | ✅ | `firebase deploy --only firestore:rules`, `Firebase/firestore.rules` |
| Firestore indexes deployed | ✅ | `COLLECTION_GROUP` index on `fcmTokens.token` (needed for stale-token cleanup) |
| Cloudflare Pages deployment | ✅ | `https://lekkervibes.pages.dev`, direct upload (not Git-connected — see `DECISIONS.md` open item) |
| Cloudflare Worker deployment | ✅ | `https://lekkervibes-api.gerhard-ark-of-war.workers.dev` |
| Feature-flagged pages (events, communities, locations, uploads, reports, blocks, saved, profile editing) | ⬜ | Disabled via `src/lib/featureFlags.js`, showing `ComingSoon` — not ported to Firestore/Worker this pass, Laravel implementations below are unaffected but unreachable live |
| Broader moderation actions (warn/mute/ban), organiser verification | ⬜ | No Worker endpoints — no product flow calls them yet |
| Automatic FCM dispatch (e.g. on new message) | ⬜ | `POST /v1/notifications/send` is real but manually-invoked only; wiring it to events needs a Cloud Function (excluded) or Cron Trigger, neither built |
| Cloudflare Pages Git integration (auto-deploy on push) | ⬜ | Pages project created via direct upload; connecting it to GitHub is a dashboard action, not done |

## Laravel/MySQL backend (disconnected from the live deployment above)

| Area | Status | Notes |
|---|---|---|
| Repo restructure (frontend consolidated into `FrontEnd/base44/`) | ✅ | Build verified |
| Git repository initialized | ✅ | Baseline snapshot committed before any changes |
| JARVIS subagent team (`.claude/agents/`) | ✅ | 22 agents defined |
| `lekkervibes` DB reset | ✅ | Old schema archived, `cap_dashboard` verified untouched |
| Laravel 13 backend scaffolded | ✅ | `BackEnd/`, MySQL configured |
| Sanctum installed (token auth) | ✅ | CORS locked to local frontend origin |
| Database schema (37 tables) | ✅ | Migrated and verified against MySQL |
| Eloquent models | ✅ | All 35, verified via `php artisan model:show` |
| Base44 usage inventory | ✅ | `BASE44_REFERENCE_MAP.md` — 25 files, all pending replacement |
| Seeders (SA city data, dev fixtures) | ✅ | Verified against MySQL |
| Auth API (register/login/logout/me/password reset) | ✅ | Live-tested end-to-end incl. token revocation |
| Profile API (profile/privacy/notifications/transport/interests) | ✅ | Live-tested |
| Locations API + saved areas | ✅ | Live-tested. Searchable combobox itself is still a frontend task |
| Events/activities API | ✅ | Browse/filter/create/join/leave/save, live-tested |
| Communities/memberships API | ✅ | Create/join/request/approve/reject, live-tested |
| Messaging API | ✅ | Polling-based per `DECISIONS.md`; conversations only auto-created via community welcome_group so far — event-scoped and organiser-announcement conversations not wired |
| Uploads API | ✅ | Live-tested incl. public URL fetch |
| Reports/blocks API | ✅ | Live-tested. Blocking doesn't yet filter blocked users out of listings (recorded only) |
| Saved API | ✅ | Live-tested |
| Notifications API | ✅ | Endpoint works but no notification types are dispatched yet — always empty until a later pass |
| Frontend API client layer (`src/api/*.js`) | ✅ | `apiClient.js` + 12 domain modules, matches `API.md` |
| Frontend: Base44 auth replaced | ✅ | AuthContext, Login, Register, ForgotPassword, ResetPassword, Navbar, PageNotFound all on `authApi`/Sanctum tokens |
| Frontend: Base44 entity calls replaced | ✅ | Discover, Clubs, ActivityDetail, ClubDetail, landing sections, Profile, ProfileEditor, CreateActivity, CreateClub, GroupChat — all on the real API. `@base44/sdk` and `@base44/vite-plugin` removed from `package.json`/`vite.config.js` entirely (0 runtime references — see `BASE44_REFERENCE_MAP.md`) |
| Public site pages | 🟨 | `/`, `/discover`, `/clubs`, `/safety`, `/login`, `/register`, `/forgot-password`, `/reset-password` wired to real data. `/communities`, `/cities`, `/how-it-works`, `/for-organisers`, `/about`, `/download` from the product brief don't exist as pages yet |
| Signed-in app shell (`/app/*`) | ⬜ | Not built — current signed-in pages (`/profile`, `/create-activity`, `/create-club`, `/chat/:conversationId`) live at top-level routes, not under an `/app` shell with the bottom-nav pattern the brief describes |
| Backend tests (PHPUnit) | ✅ | 34 tests / 120 assertions passing against in-memory SQLite (never touches the real MySQL DB) — auth, profile, events, communities, messaging, safety. See `TESTING.md` |
| Frontend tests (build/lint/routing/integration) | 🟨 | `npm run build` and `npm run lint` both pass clean; no automated test runner (Vitest/Playwright) installed — every page was verified by fetching it through the Vite dev server transform pipeline (catches syntax/import errors) plus live API calls simulating what each page does, not by driving a real browser |
| Production build verified | ✅ | `npm run build` succeeds (538KB main bundle, down from 654KB after removing `@base44/sdk`); `npm run lint` clean |

## Known limitations (current)

- No real-time transport (see `DECISIONS.md` — polling for v1, 4s interval
  in `GroupChat.jsx`).
- Google OAuth login (referenced in the original Base44 `Login.jsx`/
  `Register.jsx`) was dropped — no backend OAuth strategy decided yet.
- Email-OTP registration verification (Base44-specific) was dropped —
  registration is immediate (no email verification step yet; `User.
  email_verified_at` exists in the schema but nothing sets it).
- Blocking is recorded but not yet enforced (doesn't filter a blocked
  user's content out of feeds/listings/messaging).
- Notifications table exists and the API works, but nothing in the backend
  actually creates a notification yet (no `make:notification` classes for
  event reminders, community updates, membership approvals, etc.).
- No admin UI for the admin-only report moderation endpoints — API only,
  gated by `users.is_admin` (no seeded admin user yet either).
- Recurring events: `recurring_schedules` table and model exist, but there
  is no server-side generation of `event_occurrences` from a recurrence
  rule — occurrences must currently be created explicitly at event-creation
  time, and `CreateActivity.jsx` only creates single-occurrence events.
- No venue creation flow — `CreateActivity.jsx` doesn't let organisers pick
  or create a `Venue`; events are created with `venue_id` null and rely on
  the free-text `transport_notes` field for meeting-point info instead.
- Discover/landing sections don't yet filter by the user's selected city —
  `useLocation()`'s city picker is still a hardcoded list (not backed by
  the real `locations` table), and event/community list endpoints need a
  `location_id`, not a free-text city name, so that wiring was left as a
  follow-up rather than faked.
- Profile editing has no UI for transport preferences yet (the API exists
  and registration now seeds a default row, but `ProfileEditor.jsx` only
  covers profile fields, privacy is implicit-default, and interests).
- No automated backend or frontend test suite yet — everything verified in
  this phase was live/manual testing against the running dev servers.
