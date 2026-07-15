# Feature Status

Honest status tracker. A feature is only "Done" once it's implemented on
both sides (where applicable) and actually tested/observed working — not
merely scaffolded. Updated as work progresses.

Legend: ⬜ Not started · 🟨 In progress · ✅ Done · 🚫 Blocked

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
