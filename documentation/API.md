# API

Base URL (local): `http://127.0.0.1:8000/api`. All requests/responses JSON.
Auth: `Authorization: Bearer <token>` (Sanctum personal access token — see
`DECISIONS.md`). Public GET routes accept an optional Bearer token for
personalization (see the `$request->user('sanctum')` note in `DECISIONS.md`).

**Status: this is the real, implemented, live-tested route table as of the
backend's initial build.** Source of truth is always `BackEnd/routes/api.php`
— re-check it before trusting this doc if it's been a while.

## Conventions

- List endpoints return `{ "data": [...], "meta": {...} }` (paginated where
  noted). Single-resource endpoints return `{ "data": {...} }`.
- Validation errors: HTTP 422, Laravel's standard Form Request shape
  (`{ "message": "...", "errors": { "field": ["..."] } }`).
- Auth errors: 401 (missing/invalid token), 403 (authenticated but not
  authorized — policy failure, e.g. editing someone else's event).
- Resource responses always go through API Resource classes
  (`app/Http/Resources/**`), never raw Eloquent models.

## Auth — `/api/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | — | Creates user + profile/privacy/notification-pref rows, returns a token |
| POST | `/auth/login` | — | Returns a token |
| POST | `/auth/logout` | ✅ | Revokes the current token |
| GET | `/auth/me` | ✅ | |
| POST | `/auth/forgot-password` | — | Emails a reset link to `FRONTEND_URL/reset-password` |
| POST | `/auth/reset-password` | — | |
| GET | `/user` | ✅ | Raw user (Laravel default scaffold route, kept for convenience) |

## Profile — `/api/profile` (all ✅ auth required)

`GET /` (full bundle: user + profile + interests + privacy + notification
prefs + transport prefs) · `PUT /` (profile fields) · `PUT /privacy` ·
`PUT /notifications` · `PUT /transport` · `PUT /interests`
(`{ interest_ids: [...] }`, full sync/replace).

## Locations — `/api/locations`

`GET /` (filters: `type`, `parent_id`, `popular`, `search`) · `GET /{id}`
(with children) · `GET /me/saved-areas` ✅ · `POST /me/saved-areas` ✅ ·
`DELETE /me/saved-areas/{id}` ✅.

## Reference data

`GET /api/interests`, `GET /api/event-categories` — flat lists, no auth.

## Events / Activities — `/api/events` (also mounted at `/api/activities`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | optional | filters: `category_id`, `community_id`, `location_id`, `is_beginner_friendly`, `is_free`, `is_attend_alone_friendly`, `search`, `mine=1`, `sort` (`-trending_score` default, `starts_at`) |
| GET | `/{event}` | optional | full detail incl. all occurrences |
| POST | `/` | ✅ | body includes `occurrences: [{starts_at, ends_at?, venue_id?, capacity?}]` |
| PUT | `/{event}` | ✅ policy | organiser or community organiser/moderator |
| DELETE | `/{event}` | ✅ policy | soft delete |
| POST/DELETE | `/{event}/save` | ✅ | |
| POST | `/occurrences/{occurrence}/join` | ✅ | body `{status?: interested\|going}`, adjusts `spots_remaining` |
| POST | `/occurrences/{occurrence}/leave` | ✅ | |

## Communities — `/api/communities`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | optional | filters: `location_id`, `join_policy`, `search`, `mine=1` |
| GET | `/{community}` | optional | rules, images, creator, `my_membership` if authed |
| GET | `/{community}/members` | — | active members |
| POST | `/` | ✅ | body may include `rules: [{title, description?}]`; auto-creates organiser membership + welcome_group conversation in a transaction |
| PUT/DELETE | `/{community}` | ✅ policy | creator or organiser/moderator (delete: creator/admin only) |
| POST | `/{community}/join` | ✅ | branches on `join_policy` (open/request/invite_only) |
| POST | `/{community}/leave` | ✅ | |
| GET | `/{community}/membership-requests` | ✅ policy | organiser/moderator only |
| POST | `/{community}/membership-requests/{id}/approve` | ✅ policy | adds to welcome_group |
| POST | `/{community}/membership-requests/{id}/reject` | ✅ policy | |

**Deviation from the original brief:** memberships are nested under
`/api/communities/{community}/...` rather than a separate top-level
`/api/memberships` — cleaner REST nesting for a resource that's always
scoped to one community. No standalone `/api/memberships` group exists.

## Messaging — `/api/conversations`, `/api/messages` (all ✅ auth + membership-gated)

`GET /conversations` (list mine, with `last_message` + approximate
`unread_count`) · `GET /conversations/{id}` · `POST /conversations/{id}/read`
· `GET /conversations/{id}/messages` (`?after_id=` for polling, `?limit=`)
· `POST /conversations/{id}/messages` · `DELETE /messages/{id}` (sender,
conversation admin, or platform admin — soft delete, leaves a
`is_deleted: true` placeholder). No conversation-creation endpoint yet:
conversations are currently only created as a side effect of community
creation (welcome_group). Event-scoped and organiser-announcement
conversations aren't wired yet — see `FEATURE_STATUS.md`.

## Uploads — `/api/uploads` (✅ auth required)

`POST /` — multipart `file` (jpg/jpeg/png/webp/gif, max 8MB), returns
`{ data: { id, url, ... } }`. Caller attaches the returned `media_id` to
whatever it belongs to (profile avatar, event cover, etc.) via that
resource's own update endpoint — there's no automatic attachment.

## Reports — `/api/reports`

`POST /` ✅ any authenticated user (`reportable_type`: `user`/`event`/
`community`/`message`, `reportable_id`, `reason`, `details?`) · `GET /`,
`POST /{id}/resolve`, `POST /{id}/dismiss` — **admin only** (`is_admin`
flag on `users`; no admin UI yet, moderation is API-only for now).

## Blocks — `/api/blocks` (all ✅ auth required)

`GET /` · `POST /` (`{blocked_id}`, self-block rejected) · `DELETE /{id}`.
**Known limitation:** blocking doesn't yet filter blocked users' content out
of event/community/message listings — it only prevents/records the block
itself. Enforcing it everywhere is tracked in `FEATURE_STATUS.md`.

## Saved — `/api/saved` (✅ auth required)

`GET /` — the current user's saved events (thin wrapper reusing
`EventResource`).

## Notifications — `/api/notifications` (all ✅ auth required)

`GET /` (paginated, `meta.unread_count`) · `POST /{id}/read` ·
`POST /read-all`. Uses Laravel's built-in polymorphic notifications table.
**Nothing dispatches a notification yet** — no `make:notification` classes
exist, so this endpoint works but will always return empty until a later
pass wires up event reminders, community updates, membership decisions,
etc. to actually create rows.
