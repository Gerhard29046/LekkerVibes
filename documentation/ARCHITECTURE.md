# Architecture

Last reviewed: 2026-07-20.

## System Overview

```text
React + Vite frontend (FrontEnd/base44/)
        |
        |-- Firebase JS SDK
        |     |-- Authentication (email/password and Google)
        |     |-- Firestore (profiles, social graph, communities, events,
        |     |              messaging, saved items, notifications)
        |     |-- Storage (public product images)
        |     `-- Cloud Messaging (web push registration/foreground handling)
        |
        `-- Firebase ID token over HTTPS
              `-- Cloudflare Worker (Worker/)
                    |-- privileged admin/moderation operations
                    |-- atomic relationship approvals and blocking
                    |-- FCM sending and stale-token cleanup
                    |-- invite-link event resolution
                    `-- Google Places search/details/photo proxy
```

Production endpoints currently documented by the repository:

- Frontend: `https://lekkervibes.pages.dev`
- Worker: `https://lekkervibes-api.gerhard-ark-of-war.workers.dev`
- Firebase project: `lekkervibes-lvid001`

## Frontend

The active frontend lives in `FrontEnd/base44/`. The directory name and
some disconnected files are remnants of the original Base44 export; the
runtime no longer includes `@base44/sdk` or `@base44/vite-plugin`.

Core stack:

- React 18 and React Router 6
- Vite 6
- Firebase JS SDK
- Tailwind CSS and Radix UI
- Framer Motion and GSAP
- TanStack Query provider (most domain loading still uses effects/state)

`src/App.jsx` defines public and protected routes. `src/lib/AuthContext.jsx`
wraps Firebase Authentication and profile bootstrapping.
`src/api/<domain>Api.js` modules encapsulate Firebase and Worker access.
`src/lib/featureFlags.js` is the source of truth for UI availability.

## Firebase

Firestore Security Rules are the authorization boundary for browser
access. Current domains include:

- user profiles, preferences, usernames, activity, saved/visited places;
- follow requests, followers/following, community followers, blocks;
- social-link reveal requests and grants;
- communities, roles, membership, invite policies, and notifications;
- events, attendance, capacity/waitlist state, and invite visibility;
- community/event conversations, messages, images, announcements,
  reactions, read state, and soft deletion;
- user reports and FCM tokens.

Group, community, and event messaging is supported. Unrestricted direct
messaging is intentionally absent and must remain absent.

Storage rules allow public image reads and authenticated, size-limited,
image-only uploads. Firestore document rules control whether an uploaded
URL can be attached to a product entity.

## Cloudflare Worker

The Worker uses Hono and `jose`. It verifies Firebase ID tokens against
Google JWKS and uses service-account OAuth2 REST calls rather than the
Node-only Firebase Admin SDK.

Public capabilities:

- health check;
- Google Places discovery, search, details, and photo proxying;
- invite-link event resolution.

Authenticated or role-gated capabilities:

- initial admin bootstrap and role management;
- moderator message deletion;
- FCM sending and stale-token cleanup;
- follow-request and social-link-reveal approval;
- blocking with relationship cleanup.

## Laravel Reference Backend

`BackEnd/` contains a Laravel 13/MySQL implementation built before the
Firebase/Worker deployment pivot. It is not connected to the live
frontend. Keep it as reference code unless the product explicitly decides
to restore or archive it.

The MySQL database `cap_dashboard` belongs to a different application and
must never be accessed for LekkerVibes work.

## Local Ports

| Service | URL |
|---|---|
| Vite frontend | `http://127.0.0.1:5173` |
| Worker | `http://127.0.0.1:8787` |
| Disconnected Laravel backend | `http://127.0.0.1:8000` |
| MySQL | `127.0.0.1:3307` |
