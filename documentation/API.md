# API

Last reviewed: 2026-07-20.

## Active Cloudflare Worker API

Base URL:
`https://lekkervibes-api.gerhard-ark-of-war.workers.dev/v1`.

Authenticated requests send a Firebase ID token as
`Authorization: Bearer <token>`. Role-gated endpoints read the Firebase
custom `role` claim. CORS is controlled by `ALLOWED_ORIGINS` in
`Worker/wrangler.toml`.

Source of truth: `Worker/src/routes/*.ts`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Worker health |
| POST | `/admin/bootstrap` | Bootstrap secret | One-time first-admin promotion |
| POST | `/admin/users/:uid/role` | Admin | Set member/moderator/admin role |
| POST | `/moderation/messages/:conversationId/:messageId/delete` | Moderator | Soft-delete another member's message |
| POST | `/notifications/send` | Moderator | Send FCM notification and remove stale tokens |
| GET | `/discover` | Public | Places discovery by city/search/category/mood/location |
| GET | `/discover/photo` | Public | Cached discovery photo proxy |
| GET | `/places/text-search` | Public | General Google Places text search |
| GET | `/places/nearby-search` | Public | Coordinate/radius Places search |
| GET | `/places/photo` | Public | Cached general Places photo proxy |
| GET | `/places/:placeId` | Public | Normalized Place details |
| GET | `/events/resolve-invite` | Public | Resolve an event invite token safely |
| POST | `/follow-requests/:requestId/accept` | Request recipient | Atomically accept and create both relationship records |
| POST | `/social-reveal-requests/:requestId/accept` | Profile owner | Approve selected social-link access |
| POST | `/users/:targetUid/block` | Authenticated | Block and remove relationships, requests, and grants |

Unexpected Google/Firebase upstream failures are normalized to JSON `502`
responses by the Worker's global error handler.

## Active Firebase Client API

Most product data is accessed directly through the Firebase JS SDK rather
than REST. Firestore and Storage rules are the authorization boundary.

Frontend modules under `FrontEnd/base44/src/api/` expose these domains:

- profiles, preferences, usernames, activity feeds, and uploads;
- saved and explicitly visited places;
- follow requests, followers/following, and community following;
- social-link reveal requests and access grants;
- communities, membership, roles, invitations, and moderation;
- events, invite visibility, attendance, capacity, and waitlists;
- community/event conversations, messages, reactions, images, pins,
  announcements, read state, and soft deletion;
- notifications, reports, blocks, and FCM registration.

Messaging is limited to group, community, and event conversations.
Unrestricted one-to-one direct messaging is intentionally unsupported.

## Disconnected Laravel API

`BackEnd/routes/api.php` remains the source of truth for the older Laravel
13/Sanctum API. It contains endpoints for auth, profiles, locations,
interests, events, communities, memberships, conversations, uploads,
reports, blocks, saved items, and notifications.

That API is not used by the active frontend or live deployment. Its local
base URL is `http://127.0.0.1:8000/api`; treat it as reference code unless
the product explicitly decides to restore the Laravel/MySQL architecture.
