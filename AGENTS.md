# AGENTS.md

## Product

LekkerVibes is a South African, location-aware activity, event, and
community platform: “Find your people. Find your place. Find your vibe.”
It is not a dating app, hotel site, nightclub-only platform, or generic
ticket marketplace.

Messaging is group, community, and event based. Never add unrestricted
one-to-one direct messaging. Firestore rules enforce this structurally.

## Active Architecture

The `FrontEnd/base44/` name is historical. The exported Base44 interface
was retained as a visual and component foundation, but the live app has no
runtime Base44 dependency.

```text
React + Vite (FrontEnd/base44/)
  ├─ Firebase JS SDK: Auth, Firestore, Storage, Cloud Messaging
  └─ Cloudflare Worker (Worker/): privileged operations and Google Places
```

The Laravel/MySQL implementation in `BackEnd/` is disconnected from the
live deployment. Do not wire new frontend work to it unless the user
explicitly decides to restore that architecture.

Active paths:

- `FrontEnd/base44/`: React/Vite frontend.
- `Firebase/`: Firestore indexes/rules and Storage rules.
- `Worker/`: Hono/TypeScript Cloudflare Worker.
- `BackEnd/`: disconnected Laravel reference implementation.
- `documentation/`: architecture, decisions, API, setup, and status.

## Data and Security

- Firebase Authentication provides email/password and Google login.
- Firestore rules are the authorization layer for direct client access.
- The Worker verifies Firebase ID tokens and performs trusted multi-record,
  moderation, administrative, notification, and Google Places operations.
- Never expose service-account credentials, API secrets, or `.env.local`.
- MySQL database `cap_dashboard` belongs to another application. Never
  query, alter, seed, or delete it. Laravel work may only use `lekkervibes`.
- Do not infer visited places from location tracking. Record them only
  after an explicit user action.

## Project Conventions

- Frontend imports use `@/` for `FrontEnd/base44/src/`.
- Keep resource access in `src/api/<domain>Api.js`.
- Check `src/lib/featureFlags.js` before assuming a feature is disabled.
- Prefer Firebase/Worker implementations for active product features.
- Preserve accessibility and `prefers-reduced-motion` behavior.
- Keep the coastal-community visual system warm, modern, local, outdoorsy,
  safe, and mobile friendly.
- Do not delete existing product source or configuration without explicit
  approval. Generated output such as `dist/`, caches, and dependencies is
  disposable.

## Local Commands

```powershell
# Frontend
cd FrontEnd/base44
npm run dev
npm run build
npm run lint
npm run typecheck

# Worker
cd Worker
npm run dev
npm run typecheck

# Laravel reference backend (PHP is not normally on PATH)
$env:PATH = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:PATH
cd BackEnd
php artisan test
```

Run the relevant checks before finishing a change. Read `README.md` and
`documentation/LOCAL_SETUP.md` for environment setup and publishing.

## Base44 Historical Files

`FrontEnd/base44/config.jsonc`, `entities/`, and a disconnected
`src/api/base44Client.js` remain from the original export. Do not restore
the Base44 SDK or Vite plugin unless the user explicitly chooses to migrate
back. If Base44-specific work is requested, install or update its skills
with `npx skills add base44/skills` and follow the applicable skill.
