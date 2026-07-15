# API

Base URL (local): `http://127.0.0.1:8000/api`. All requests/responses JSON.
Auth: `Authorization: Bearer <token>` (Sanctum personal access token — see
`DECISIONS.md` for why token auth was chosen over cookie/SPA mode).

**Status: contract below is the target shape; endpoints are being built
incrementally — see `FEATURE_STATUS.md` for what actually exists today.**

## Conventions

- List endpoints are paginated (Laravel's default `?page=`/`per_page`
  cursor or length-aware paginator — response includes `data`, `meta`,
  `links`).
- Validation errors: HTTP 422, `{ "message": "...", "errors": { "field": ["..."] } }`
  (Laravel's standard Form Request error shape).
- Auth errors: 401 (no/invalid token), 403 (authenticated but not
  authorized — policy failure).
- Resource responses go through API Resource classes (`app/Http/
  Resources/**`) — never raw Eloquent models — so response shape is
  decoupled from DB columns.

## Endpoint groups

| Group | Base path | Covers |
|---|---|---|
| Auth | `/api/auth` | register, login, logout, forgot/reset password, email verification |
| User | `/api/user` | current user (`/api/user` → `auth:sanctum` protected) |
| Profile | `/api/profile` | profile CRUD, privacy settings, notification preferences, transport preferences, interests |
| Locations | `/api/locations` | hierarchical search (province/city/town/suburb), popular/recent/saved areas |
| Interests | `/api/interests` | interest taxonomy |
| Events | `/api/events` | browse/search/filter/create/edit/join/leave, occurrences, attendance |
| Activities | `/api/activities` | alias/subset of events for activity-style listings (product-facing naming — see `product-agent`) |
| Communities | `/api/communities` | browse/search/create/edit, rules, images, linked activities |
| Memberships | `/api/memberships` | join/leave, request-to-join, approve/reject, roles |
| Conversations | `/api/conversations` | list a user's conversations (community/event/welcome-group/announcement) |
| Messages | `/api/messages` | list/send/delete messages within a conversation, read receipts |
| Uploads | `/api/uploads` | profile photos, event/community images, message attachments |
| Reports | `/api/reports` | file + review reports |
| Blocks | `/api/blocks` | block/unblock users |
| Saved | `/api/saved` | saved/bookmarked events |
| Notifications | `/api/notifications` | list, mark read |

Full request/response examples will be added here as each group is
implemented — see `routes/api.php` in the backend for the authoritative,
currently-registered route list at any point in time.
