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
| Eloquent models | 🟨 | In progress |
| Base44 usage inventory | ✅ | `BASE44_REFERENCE_MAP.md` — 25 files, all pending replacement |
| Seeders (SA city data, dev fixtures) | ⬜ | |
| Auth API (register/login/logout/me/password reset) | ⬜ | |
| Profile API | ⬜ | |
| Locations API + searchable combobox | ⬜ | |
| Events/activities API | ⬜ | |
| Communities API | ⬜ | |
| Messaging API | ⬜ | Polling-based for v1, see `DECISIONS.md` |
| Uploads API | ⬜ | |
| Reports/blocks API | ⬜ | |
| Notifications API | ⬜ | |
| Frontend API client layer (`src/api/*.js`) | ⬜ | |
| Frontend: Base44 auth replaced | ⬜ | |
| Frontend: Base44 entity calls replaced | ⬜ | |
| Public site pages | ⬜ | Some pages exist from the Base44 export reference; need review against the full route list in the project brief |
| Signed-in app shell (`/app/*`) | ⬜ | Not yet started — current routes are the pre-restructure Base44 route table |
| Backend tests | ⬜ | |
| Frontend tests (build/lint/routing/integration) | ⬜ | |
| Production build verified | 🟨 | Verified once at the raw-Base44-export stage; needs re-verification after each major integration step |

## Known limitations (current)

- The frontend still runs entirely on the Base44 SDK — no feature is
  connected to the new Laravel API yet.
- No file storage/CDN configured yet (uploads API not built).
- No real-time transport (see `DECISIONS.md` — polling for v1).
- Google OAuth login (referenced in the Base44 `Login.jsx`/`Register.jsx`)
  has no backend equivalent decided yet.
