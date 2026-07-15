# Base44 Reference Map

LekkerVibes is being migrated off Base44 (a hosted low-code backend platform) onto a
custom Laravel + MySQL backend. The frontend currently lives at `FrontEnd/base44/`
(that folder name is a historical artifact of where the Base44 export was consolidated
— it is **not** meant to keep using Base44 at runtime). **The goal is zero runtime
Base44 dependency**: no `@base44/sdk` client, no `@base44/vite-plugin`, no
`base44.auth.*` / `base44.entities.*` / `base44.integrations.*` calls, and no
Base44-hosted asset URLs anywhere in the shipped frontend.

This document is a factual inventory of every place Base44 is referenced today, so the
migration work can be tracked file by file. It does not redesign the schema and does
not invent replacement code that doesn't exist yet — the new backend's `src/api/*.js`
client modules (`apiClient.js`, `authApi.js`, `profileApi.js`, `locationApi.js`,
`eventsApi.js`, `activitiesApi.js`, `communitiesApi.js`, `messagesApi.js`,
`uploadsApi.js`, `reportsApi.js`, `savedApi.js`, `notificationsApi.js`) do not exist
yet in this repo; only `src/api/base44Client.js` currently exists under
`FrontEnd/base44/src/api/`. Every call site below is therefore recorded as **not yet
replaced**, with a suggested target module for when that work happens.

Search scope covered: `FrontEnd/base44/App.jsx` (n/a, lives at `src/App.jsx`),
`src/main.jsx`, all of `src/**`, `base44/config.jsonc`, `base44/entities/**`,
`package.json`, and `package-lock.json`.

## Package dependencies to remove

From `FrontEnd/base44/package.json` (`dependencies`):

| Package | Version | Purpose |
|---|---|---|
| `@base44/sdk` | `^0.8.39` | Frontend SDK client (`createClient`, `.auth`, `.entities`, `.integrations`) |
| `@base44/vite-plugin` | `^1.0.30` | Vite plugin providing HMR notifier, navigation notifier, analytics tracker, visual edit agent, and legacy `@/entities` / `@/integrations` import shims for the Base44 platform |

Both should be removed once all call sites below are migrated. `package-lock.json`
will regenerate automatically once these are removed from `package.json` and
`npm install` is re-run — no manual edits needed there.

Also worth removing/replacing once the backend exists:
- `FrontEnd/base44/base44/config.jsonc` — Base44 CLI project/site config
  (`installCommand`, `buildCommand`, `serveCommand`, `outputDirectory`). This drives
  `base44 dev` / the Base44 CLI workflow described in the repo's `AGENTS.md`, not the
  application code itself, but it's a Base44-specific file that has no purpose once the
  app no longer targets the Base44 platform.
- `FrontEnd/base44/base44/entities/*.jsonc` — Base44 entity schema definitions (see
  "Entity mapping" below). These are design-time schema files consumed by the Base44
  CLI/platform, not imported by the frontend at runtime.
- `FrontEnd/base44/dist/` — a stale production build (`index-*.js`, `index-*.css`)
  that bundles the compiled `@base44/sdk` client. It's build output, not source; it
  will stop containing Base44 code automatically once the source is migrated and the
  app is rebuilt. Not inventoried line-by-line since it's generated, not authored.

## File-by-file inventory

All file paths are relative to `FrontEnd/base44/`.

| File | Base44 references | Real feature | Suggested replacement |
|---|---|---|---|
| `src/api/base44Client.js` | `import { createClient } from '@base44/sdk'`; builds and exports the `base44` client singleton using `appParams` (`appId`, `token`, `functionsVersion`, `appBaseUrl`) | Central SDK client instance that every other file imports | Replace entirely with `src/api/apiClient.js` — a thin fetch/axios wrapper around the Laravel REST API base URL, auth header injection, and error normalization |
| `src/lib/app-params.js` | Reads/writes `localStorage` keys prefixed `base44_*` (`base44_access_token`, `base44_app_id`, etc.), reads `VITE_BASE44_APP_ID`, `VITE_BASE44_FUNCTIONS_VERSION`, `VITE_BASE44_APP_BASE_URL` env vars, and URL query params (`app_id`, `access_token`, `functions_version`, `app_base_url`, `clear_access_token`) | Bootstraps the Base44 app/session identity (app id + access token) from the hosting iframe/URL on load | Replace with plain JWT/session-token storage logic inside `authApi.js` / `apiClient.js` (no "app id" concept needed for a self-hosted backend) |
| `src/lib/AuthContext.jsx` | `import { base44 } from '@/api/base44Client'`; `import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client'`; calls `base44.auth.me()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`; also calls a Base44 platform endpoint directly via a hand-built axios client hitting `/api/apps/public/prod/public-settings/by-id/{appId}` | Global auth/session context: current user, auth-required/user-not-registered error states, app public settings | Replace with `authApi.js` (`getCurrentUser()`, `logout()`) — the "app public settings" / multi-tenant "app" concept is Base44-platform-specific and has no analog needed in a single-tenant Laravel app; that check can likely be dropped entirely |
| `src/components/ProtectedRoute.jsx` | No direct Base44 import, but consumes `useAuth()` from `AuthContext.jsx` and its `authError.type === 'user_not_registered'` state, which originates from the Base44 app-public-settings check above | Route guard for authenticated pages | No change needed once `AuthContext.jsx` is migrated to `authApi.js`; the "user not registered" branch should be reconsidered/simplified |
| `src/lib/PageNotFound.jsx` | `import { base44 } from '@/api/base44Client'`; calls `base44.auth.me()` (via `useQuery`) to check `user?.role === 'admin'` and show an "Admin Note" | Shows an admin-only hint on 404 pages | `authApi.js` `getCurrentUser()` |
| `src/pages/Login.jsx` | `base44.auth.loginViaEmailPassword(email, password)`; `base44.auth.loginWithProvider('google', '/')` | Email/password login form, Google OAuth button | `authApi.js` — e.g. `login(email, password)` calling `POST /api/auth/login`; Google OAuth flow needs a Laravel-side OAuth strategy decision |
| `src/pages/Register.jsx` | `base44.auth.register({ email, password })`; `base44.auth.verifyOtp({ email, otpCode })`; `base44.auth.setToken(token)`; `base44.auth.resendOtp(email)`; `base44.auth.loginWithProvider('google', '/')` | Registration form with email OTP verification step, Google OAuth | `authApi.js` — `register()`, `verifyOtp()`, `resendOtp()`; OTP email-verification flow needs a Laravel-side equivalent |
| `src/pages/ForgotPassword.jsx` | `base44.auth.resetPasswordRequest(email)` | "Send reset link" form | `authApi.js` `requestPasswordReset(email)` |
| `src/pages/ResetPassword.jsx` | `base44.auth.resetPassword({ resetToken, newPassword })` | New-password form driven by a `?token=` query param | `authApi.js` `resetPassword({ token, newPassword })` |
| `src/components/landing/Navbar.jsx` | `base44.auth.me()` to populate the logged-in user avatar/menu | Site nav login/logged-in state | `authApi.js` `getCurrentUser()` |
| `src/pages/Profile.jsx` | `base44.auth.me()`; `base44.entities.UserProfile.filter({ user_id })`; `base44.entities.ActivityAttendance.filter({ user_id })`; `base44.entities.Activity.get(id)` (per attended activity, up to 6); `base44.entities.ClubMember.filter({ user_id, status: 'active' })`; `base44.entities.Club.get(id)` (per joined club, up to 6) | User's own profile page: bio/photos, joined activities tab, joined clubs tab | `authApi.js` (current user), `profileApi.js` (profile fields), `activitiesApi.js`/`eventsApi.js` (attended events), `communitiesApi.js` (joined communities) |
| `src/components/profile/ProfileEditor.jsx` | `base44.integrations.Core.UploadFile({ file })` (profile photo + cover photo); `base44.entities.UserProfile.update(id, data)` / `base44.entities.UserProfile.create(data)` | Edit-profile modal: photo upload, display name, bio, interests, prefs | `uploadsApi.js` for file upload, `profileApi.js` for create/update |
| `src/pages/CreateActivity.jsx` | `base44.auth.me()`; `base44.entities.ClubMember.filter({ user_id, status: 'active' })`; `base44.entities.Club.get(id)` (per membership, to populate the "Link to Club" dropdown); `base44.integrations.Core.UploadFile({ file })` (cover image); `base44.entities.Activity.create(data)` | "Create an Activity" form | `authApi.js`, `communitiesApi.js` (club dropdown), `uploadsApi.js` (cover image), `activitiesApi.js`/`eventsApi.js` `create()` |
| `src/pages/CreateClub.jsx` | `base44.auth.me()`; `base44.integrations.Core.UploadFile({ file })` (cover + logo); `base44.entities.Club.create(data)`; `base44.entities.ClubMember.create({ club_id, user_id, role: 'organiser', status: 'active' })` | "Create a Group" form, auto-joins creator as organiser | `authApi.js`, `uploadsApi.js`, `communitiesApi.js` `create()` + membership creation |
| `src/pages/Clubs.jsx` | `base44.entities.Club.filter({ city, status: 'active' }, '-trending_score', 50)` | Community directory/listing page with client-side search filter | `communitiesApi.js` `list({ city, status, sort, limit })` |
| `src/pages/ClubDetail.jsx` | `base44.entities.Club.get(id)`; `base44.entities.Activity.filter({ club_name, status: 'published' }, '-date', 10)` | Single community page: details + its upcoming activities | `communitiesApi.js` `get(id)`, `activitiesApi.js`/`eventsApi.js` `list({ communityId, status, sort })` (note: current code matches by `club_name` string, not `club_id` — a real FK join is preferable in the new API) |
| `src/components/landing/ClubsSection.jsx` | `base44.entities.Club.filter({ city, status: 'active' }, '-trending_score', 4)` | Landing-page "Popular communities" carousel | `communitiesApi.js` `list()` |
| `src/pages/ActivityDetail.jsx` | `base44.entities.Activity.get(id)` | Single activity detail page | `activitiesApi.js`/`eventsApi.js` `get(id)` |
| `src/pages/Discover.jsx` | `base44.entities.Activity.filter(query, '-trending_score', 50)` with dynamic filters (`status`, `city`, `category`, `is_beginner_friendly`, `is_free`, `is_attend_alone_friendly`) plus client-side text search | Activity search/discovery page | `activitiesApi.js`/`eventsApi.js` `list(filters)` |
| `src/components/landing/GoAloneSection.jsx` | `base44.entities.Activity.filter({ city, status: 'published', is_attend_alone_friendly: true }, '-trending_score', 4)` | Landing-page "go alone" activity carousel | `activitiesApi.js`/`eventsApi.js` `list()` |
| `src/components/landing/TrendingSection.jsx` | `base44.entities.Activity.filter({ city, status: 'published' }, '-trending_score', 4)` | Landing-page "trending near you" carousel | `activitiesApi.js`/`eventsApi.js` `list()` |
| `src/pages/GroupChat.jsx` | `base44.auth.me()`; `base44.entities.UserProfile.filter({ user_id })`; `base44.entities.Club.get(id)` / `base44.entities.Activity.get(id)` (group header); `base44.entities.GroupMessage.filter({ group_type, group_id, is_deleted: false }, 'created_date', 50)`; **`base44.entities.GroupMessage.subscribe(callback)`** (real-time create/delete events); `base44.entities.GroupMessage.create(data)`; `base44.entities.GroupMessage.update(id, { is_deleted: true })` | Group chat for a club or an activity, including live message push | `authApi.js`, `profileApi.js`, `communitiesApi.js`/`activitiesApi.js` (group header), `messagesApi.js` for list/create/soft-delete. **The `.subscribe()` real-time call has no equivalent yet** — needs a decision on the new backend's real-time transport (e.g. WebSockets/Laravel Echo/Pusher/polling) before it can be replaced |
| `src/components/ui/image.jsx` | Hardcoded hostname `media.base44.com` in `WIX_MEDIA_HOSTS`, used to detect Base44/Wix-hosted image URLs and rewrite them into resized/WebP transform URLs (`/v1/fill/...` etc.) | Responsive image component with on-the-fly CDN resizing for images uploaded via Base44's media platform | Once uploads move to `uploadsApi.js` and the new backend's own storage/CDN, this component's URL-detection logic should target the new asset host (or be replaced with a simpler `<img>`/CDN-native transform scheme); `media.base44.com` will no longer be a valid host to special-case |
| `src/main.jsx` | No direct reference | Bootstraps `App.jsx` | No change needed |
| `src/App.jsx` | No direct reference (consumes `useAuth()` from `AuthContext.jsx` indirectly) | Route table + top-level auth gate | No change needed beyond what `AuthContext.jsx`'s migration requires |
| `vite.config.js` | `import base44 from "@base44/vite-plugin"`; configures `legacySDKImports`, `hmrNotifier`, `navigationNotifier`, `analyticsTracker`, `visualEditAgent` | Vite build plugin providing Base44 platform integration (dev HMR notifications to the Base44 editor, analytics, visual editing) | Remove the `base44()` plugin entirely; keep only the `@vitejs/plugin-react` plugin |
| `package.json` | `"@base44/sdk"`, `"@base44/vite-plugin"` in `dependencies`; `"typecheck": "tsc -p ./jsconfig.json"` references `jsconfig.json`, which excludes `src/api` and `src/lib` from type-checking (both contain the current Base44 client code) | Package manifest | Remove both packages after all call sites above are migrated (see "Package dependencies to remove") |
| `package-lock.json` | Lockfile entries for `@base44/sdk` and `@base44/vite-plugin` and their transitive deps | Dependency lock | Regenerates automatically on `npm install` after `package.json` is updated |

Files under `FrontEnd/base44/src/` that were checked and contain **no** Base44
references (for completeness — not exhaustively listed elsewhere in this doc):
`src/index.css`, `src/hooks/use-mobile.jsx`, `src/hooks/use-size.jsx`,
`src/hooks/useLocation.jsx`, `src/lib/query-client.js`, `src/lib/utils.js`,
`src/components/AuthLayout.jsx`, `src/components/GoogleIcon.jsx`,
`src/components/ScrollToTop.jsx`, `src/components/UserNotRegisteredError.jsx`,
`src/pages/Home.jsx`, `src/pages/Safety.jsx`, `src/utils/index.ts`, and everything
under `src/components/ui/**` (except `image.jsx`, noted above) and
`src/components/landing/**` other than the four landing sections listed in the table
(`ActivityCard.jsx`, `CTASection.jsx`, `FindCrewSection.jsx`, `Footer.jsx`,
`HeroSection.jsx`, `MoodSelector.jsx` are all presentational/prop-driven and do not
call Base44 directly).

Worth flagging separately: several forms/hooks hardcode a `CITIES` array
client-side (`src/pages/CreateActivity.jsx`, `src/pages/CreateClub.jsx`,
`src/components/profile/ProfileEditor.jsx`, `src/hooks/useLocation.jsx`) instead of
querying the Base44 `City` entity at all. This isn't a Base44 call site to remove, but
it's a gap to close when `locationApi.js` exists — these hardcoded lists should
become the seed data / fallback, not the source of truth.

## Entity mapping

Base44 entity schemas live under `FrontEnd/base44/base44/entities/*.jsonc`. These are
design-time schema files (not imported by frontend code at runtime — all data access
goes through `base44.entities.<Name>.*` calls against the Base44 backend). Mapping
each to its nearest new-backend concept, per the richer schema already being designed
elsewhere in this migration:

| Base44 entity | File | New backend concept | Notes |
|---|---|---|---|
| `Activity` | `Activity.jsonc` | `events` / `event_occurrences` | Base44's flat `Activity` mixes series-level fields (`title`, `category`, `is_recurring`, `recurrence_pattern`) with instance-level fields (`date`, `start_time`, `spots_remaining`, `attendee_count`) on one record — the new schema splits this into an event definition plus dated occurrences |
| `ActivityAttendance` | `ActivityAttendance.jsonc` | `event_attendees` (attendance tied to `event_occurrences`) | Currently keyed by `activity_id` + `user_id` with a `status` enum (`interested`/`going`/`attended`/`cancelled`) |
| `City` | `City.jsonc` | `cities` | Reference/lookup table; frontend currently hardcodes city lists instead of querying this entity at all (see note above) |
| `Club` | `Club.jsonc` | `communities` | — |
| `ClubMember` | `ClubMember.jsonc` | `community_members` | Keyed by `club_id` + `user_id`, with `role` and `status` enums |
| `GroupMessage` | `GroupMessage.jsonc` | `conversations` / `messages` | Base44's single flat `GroupMessage` (keyed by `group_type` + `group_id`) maps to a conversation scoped to a community or event, containing individual messages |
| `Notification` | `Notification.jsonc` | `notifications` | Not currently consumed anywhere in the frontend code read for this inventory (no `base44.entities.Notification.*` call sites found) |
| `Report` | `Report.jsonc` (**empty file** — no schema defined in this export) | `reports` | UI affordances exist (Flag/"Report" buttons in `src/pages/ActivityDetail.jsx` and `src/pages/ClubDetail.jsx`) but are not wired to any `base44.entities.Report.*` call — purely decorative buttons today |
| `Review` | `Review.jsonc` | `reviews` | Multi-dimensional rating (`welcoming`, `accuracy`, `organisation`, `safety`, `beginner_friendliness`, `value`, `venue_quality`) plus `comment`; not currently consumed anywhere in the frontend code read for this inventory |
| `SavedActivity` | `SavedActivity.jsonc` | `saved_activities` / `saved_events` (bookmarks tied to `event_occurrences`) | Keyed by `activity_id` + `user_id`; not currently consumed anywhere in the frontend code read for this inventory (the "Save" button in `ActivityDetail.jsx` has no handler) |
| `User` | `User.jsonc` | `users` | Only defines a `role` enum (`admin`/`user`) — Base44's own identity/auth record supplies everything else (`id`, `email`, `full_name`, etc.) via `base44.auth.me()`, not via `base44.entities.User.*` |
| `UserProfile` | `UserProfile.jsonc` (**empty file** — no schema defined in this export) | `user_profiles` | Actual shape has to be inferred from usage: `src/components/profile/ProfileEditor.jsx` and `src/pages/Profile.jsx` read/write `user_id`, `display_name`, `username`, `bio`, `city`, `neighbourhood`, `pronouns`, `age_range`, `interests` (array), `profile_photo`, `cover_photo`, `alcohol_free_pref`, `family_friendly_pref`, `member_since`, `is_verified` |

## Replacement status — UPDATE (post-migration)

**All call sites below are now replaced.** `@base44/sdk` and
`@base44/vite-plugin` have been removed from `package.json` and
`vite.config.js` entirely — there are zero runtime Base44 references left in
`FrontEnd/base44/src/**`. The `@` path alias that `@base44/vite-plugin` was
silently providing is now configured directly in `vite.config.js`
(`resolve.alias`). `src/api/` now contains `apiClient.js` plus one module per
domain: `authApi.js`, `profileApi.js`, `locationApi.js`, `eventsApi.js`
(also exported as `activitiesApi`), `eventCategoriesApi` (same file),
`interestsApi.js`, `communitiesApi.js`, `messagesApi.js`, `uploadsApi.js`,
`reportsApi.js`, `blocksApi.js`, `savedApi.js`, `notificationsApi.js`.

| Area | Status |
|---|---|
| Auth (login, register, password reset, logout, session check) | **Replaced.** Email-OTP verification and Google OAuth were dropped, not ported — no backend equivalent exists (see `FEATURE_STATUS.md`) |
| User profile (read/update, photo upload) | **Replaced.** `ProfileEditor.jsx` now uploads via `uploadsApi` and saves `avatar_media_id`/`cover_media_id`, not a raw URL string |
| Activities / events (list, filter, get, create, join/leave, save) | **Replaced.** `eventsApi` + `EventAttendanceController`; `CreateActivity.jsx` creates single-occurrence events only (no recurrence UI, no venue picker — see `FEATURE_STATUS.md`) |
| Communities / clubs (list, filter, get, create, membership) | **Replaced.** `communitiesApi` + `MembershipController`; `CreateClub.jsx`'s free-text "categories" multi-select was dropped (no `community_categories` concept in the new schema) in favour of the real `rules` field |
| Group chat / messages (list, create, delete, real-time subscribe) | **Replaced, transport downgraded to polling.** `GroupChat.jsx` now keys off a `conversationId` route param (was Base44's `groupType`/`groupId`) and polls every 4s — see the real-time decision in `DECISIONS.md` |
| File uploads (cover images, avatars) | **Replaced.** Generic `POST /api/uploads` returns a `media_id` + public URL; every "upload a photo" flow now does upload-then-reference instead of Base44's inline `file_url` |
| Notifications, reports, saved activities | **Replaced except notifications-as-a-feature.** `reportsApi`/`savedApi` are wired (report buttons on `ActivityDetail`/`ClubDetail`, saved list on `Profile`); a notifications UI was not built even though the API exists (nothing dispatches notifications server-side yet) |
| Reviews | **Not replaced — feature not built.** No `reviews` table/model/endpoint exists yet; this was already unused in the Base44-era frontend |
| City/location lookup | **Partially replaced.** `locationApi` exists and powers the profile/community location dropdowns (via `locationApi.popular()`), but `useLocation()`'s city switcher (navbar, Discover, landing sections) is still a hardcoded city list, not backed by the `locations` table — city-based filtering on event/community lists was left unwired since it needs a `location_id`, not a free-text city name (documented in `FEATURE_STATUS.md` rather than faked) |

## Deprecated / orphaned files — full deletion-approval report

Per the project's file-deletion policy, nothing below was deleted. This is
the complete list of files disconnected from runtime as of the Base44
migration, kept in place pending Gerhard's explicit approval to remove.

**Orphaned frontend source** (not imported by any live code path — verified
via a full `grep -r base44 src/` sweep cross-checked against actual import
graphs):

- `FrontEnd/base44/src/api/base44Client.js` — the old Base44 SDK client singleton, nothing imports it anymore
- `FrontEnd/base44/src/lib/app-params.js` — Base44 app-id/token bootstrap helper, only ever imported by `base44Client.js`
- `FrontEnd/base44/src/components/ui/image.jsx` — responsive image component with `media.base44.com`-specific CDN transform logic; not imported anywhere
- `FrontEnd/base44/src/components/GoogleIcon.jsx` — only used by the Google OAuth buttons removed from `Login.jsx`/`Register.jsx` (no backend OAuth strategy exists yet — see `DECISIONS.md`)

**Non-code Base44 platform artifacts:**

- `FrontEnd/base44/base44/config.jsonc` — Base44 CLI project/site config (`installCommand`, `serveCommand`, etc.), meaningless without the Base44 platform
- `FrontEnd/base44/base44/entities/*.jsonc` (12 files: `Activity`, `ActivityAttendance`, `City`, `Club`, `ClubMember`, `GroupMessage`, `Notification`, `Report`, `Review`, `SavedActivity`, `User`, `UserProfile`) — Base44 design-time entity schemas, fully superseded by the MySQL schema in `DATABASE.md`

**Stale-but-not-code:** `AGENTS.md` and `README.md` at the repo root still describe the original Base44 CLI workflow (`base44 dev`, publishing through the Base44 dashboard, `.env.local` with `VITE_BASE44_APP_ID`) — none of this applies anymore. Not deletion candidates (they're documentation, not runtime code) but worth a rewrite pass to point at `documentation/LOCAL_SETUP.md` instead; left untouched so far since they don't affect the running application.

One code comment in `FrontEnd/base44/src/lib/AuthContext.jsx` references "the Base44-era loading gate" — historical context, not a dependency, not a candidate for anything.
