# Architecture

## System overview

```
React + Vite frontend (FrontEnd/base44/)
        |
        |-- Firebase JS SDK (Auth, Firestore, Cloud Messaging) -----> Firebase project `lekkervibes-lvid001`
        |                                                              (Firestore Security Rules are the
        |                                                               authorization layer for this path)
        |
        `-- fetch + Firebase ID token (Bearer), JSON over HTTPS ----> Cloudflare Worker `lekkervibes-api`
                                                                       (trusted ops only — admin role changes,
                                                                        moderator message deletion, FCM send)
```

Live URLs: `https://lekkervibes.pages.dev` (frontend, Cloudflare Pages) and
`https://lekkervibes-api.gerhard-ark-of-war.workers.dev` (Worker). Both are
Cloudflare's free generated domains — no purchased domain yet; see
`DECISIONS.md` (2026-07-16 entry) for why, and for how a custom domain
attaches later without an architecture change.

**Laravel/MySQL (`BackEnd/`) is disconnected from this live deployment**,
not deleted — it was never actually deployed anywhere (local-only,
`127.0.0.1:8000`), and this pass replaces it for auth/chat/FCM specifically.
See `FEATURE_STATUS.md` for exactly what's live vs. feature-flagged off.
The React files under `FrontEnd/base44/` still carry their historical
Base44 origin (see `BASE44_REFERENCE_MAP.md`) — that migration is unrelated
and unaffected by this one.

## Frontend

- **Location:** `FrontEnd/base44/` (folder name is a historical artifact).
- **Stack:** React 18, Vite 6, React Router 6, TanStack Query 5, Tailwind
  CSS, Radix UI primitives, Framer Motion, `firebase` (JS SDK v10+).
- **Entrypoint:** `src/main.jsx` → `src/App.jsx` (route table + top-level
  auth gate). Path alias `@/` → `./src/*`.
- **Firebase client:** `src/lib/firebaseClient.js` initializes the app and
  exports `auth`/`db` plus `getMessagingIfSupported()`. `src/lib/
  AuthContext.jsx` wraps Firebase Auth (`onAuthStateChanged`, email/password,
  Google via `GoogleAuthProvider` + `signInWithPopup`) behind the same
  `useAuth()` shape the rest of the app already expected, so `ProtectedRoute.
  jsx`/`App.jsx` needed no changes. `src/lib/fcmRegistration.js` requests
  notification permission, registers the FCM token under `users/{uid}/
  fcmTokens/{token}`, and handles foreground pushes via `onMessage` (toast);
  `public/firebase-messaging-sw.js` handles background pushes.
- **Chat:** `src/pages/GroupChat.jsx` + `src/api/messagesApi.js` use
  Firestore's `onSnapshot` for real-time updates — no polling.
- **Feature flags:** `src/lib/featureFlags.js` gates every page/section
  still backed by the disconnected Laravel API behind a flag, rendering
  `src/components/ComingSoon.jsx` instead of calling a backend that isn't
  live. `src/api/*.js` modules for those domains (events, communities,
  locations, etc.) are untouched and still point at `VITE_API_BASE_URL` —
  they're simply unreachable from any live page right now.
- **Trusted-API client:** `src/api/apiClient.js` calls the Worker's `/v1/*`
  endpoints (not Firestore/Auth, which go through the Firebase SDK
  directly), attaching `await auth.currentUser?.getIdToken()` as the Bearer
  token.

## Cloudflare Worker (`Worker/`)

- **Name:** `lekkervibes-api`, deployed via Wrangler to the default
  `*.workers.dev` subdomain (no custom route yet).
- **Stack:** Hono (routing/CORS), `jose` (JWT verification + signing) — no
  `firebase-admin`/`google-auth-library`, since Workers can't run their
  required Node APIs.
- **Auth middleware** (`src/middleware/auth.ts`): verifies the caller's
  Firebase ID token against Google's JWKS (`jose.createRemoteJWKSet`),
  reads the `role` custom claim from the token for `requireRole()` gating.
- **Trusted-op libs** (`src/lib/`): `gcpAuth.ts` mints a GCP OAuth2 access
  token from a service-account JWT-bearer exchange (cached per isolate);
  `firestoreRest.ts`/`identityToolkit.ts`/`fcm.ts` call Firestore, Identity
  Toolkit (custom claims), and FCM HTTP v1 as plain REST using that token —
  this deliberately **bypasses** Firestore Security Rules, which is the
  point (e.g. a moderator deleting someone else's message can't be
  expressed in rules, which only allow self-delete).
- **Routes** (`src/routes/`): `GET /v1/health`; `POST /v1/admin/bootstrap`
  (one-shot first-admin creation, gated by an `ADMIN_BOOTSTRAP_SECRET`
  header secret); `POST /v1/admin/users/:uid/role` (admin-gated ongoing role
  changes); `POST /v1/moderation/messages/:conversationId/:messageId/delete`
  (moderator-gated); `POST /v1/notifications/send` (moderator-gated FCM
  send, auto-removes the token's Firestore doc if FCM reports it as
  stale/unregistered).
- **Secrets** (`wrangler secret put`, never committed): `GCP_SERVICE_
  ACCOUNT_JSON`, `ADMIN_BOOTSTRAP_SECRET`.
- **CORS:** allow-list driven by the `ALLOWED_ORIGINS` var in `wrangler.
  toml` (comma-separated) — currently `https://lekkervibes.pages.dev,
  http://localhost:5173,http://127.0.0.1:5173`.

## Firebase (project `lekkervibes-lvid001`)

- **Authentication:** Email/Password and Google providers enabled.
  Authorized domains include `lekkervibes.pages.dev`.
- **Firestore:** Native mode. Data model this pass is intentionally narrow
  (see `Firebase/firestore.rules`): `users/{uid}` (profile + `role`),
  `users/{uid}/fcmTokens/{tokenId}`, `conversations/{conversationId}`
  (`memberIds`-gated, no 1:1 DM collection — group/community messaging
  only, per the project's non-negotiable constraint), `conversations/
  {conversationId}/messages/{messageId}`.
- **Security rules** (`Firebase/firestore.rules`, deployed via `firebase
  deploy --only firestore:rules`): a user can read any profile but only
  write their own, and can't change their own `role`; conversation reads
  require membership; message creation requires membership + `senderId ==
  auth.uid`; a sender may soft-delete their own message but never hard-
  delete, and never delete someone else's (that's Worker-only).
- **Indexes** (`Firebase/firestore.indexes.json`): a `COLLECTION_GROUP`
  index on `fcmTokens.token` — required for the Worker's stale-token
  cleanup, which queries across every user's `fcmTokens` subcollection at
  once without knowing the owning `uid` ahead of time.
- **Cloud Messaging:** Web Push certificate (VAPID key) configured;
  `VITE_FIREBASE_VAPID_KEY` in the frontend env.

## Database (Laravel/MySQL — disconnected, not deleted)

MySQL 8.4, database `lekkervibes`, host `127.0.0.1`, port `3307`. Full
schema in `DATABASE.md`. Never touch the `cap_dashboard` database on the
same server — it belongs to an unrelated application. Not part of the live
deployment described above; see `FEATURE_STATUS.md`.

## Local ports (development)

| Service | URL |
|---|---|
| Frontend (Vite dev server) | `http://127.0.0.1:5173` |
| Worker (`wrangler dev`) | `http://127.0.0.1:8787` |
| Backend (Laravel dev server, disconnected from prod) | `http://127.0.0.1:8000` |
| MySQL | `127.0.0.1:3307` |

See `LOCAL_SETUP.md` for exact commands.
