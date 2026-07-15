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
| Frontend API client layer (`src/api/*.js`) | ⬜ | Backend is ready for this now |
| Frontend: Base44 auth replaced | ⬜ | |
| Frontend: Base44 entity calls replaced | ⬜ | |
| Public site pages | ⬜ | Some pages exist from the Base44 export reference; need review against the full route list in the project brief |
| Signed-in app shell (`/app/*`) | ⬜ | Not yet started — current routes are the pre-restructure Base44 route table |
| Backend tests (Pest/PHPUnit) | ⬜ | Every endpoint above was manually live-tested against the dev server, not covered by an automated test suite yet |
| Frontend tests (build/lint/routing/integration) | ⬜ | |
| Production build verified | 🟨 | Verified once at the raw-Base44-export stage; needs re-verification after each major integration step |

## Known limitations (current)

- The frontend still runs entirely on the Base44 SDK — no feature is
  connected to the new Laravel API yet, even though the API is ready.
- No real-time transport (see `DECISIONS.md` — polling for v1).
- Google OAuth login (referenced in the Base44 `Login.jsx`/`Register.jsx`)
  has no backend equivalent decided yet.
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
  time.
- No automated backend or frontend test suite yet — everything verified in
  this phase was live/manual testing against the running dev server.
