# Architecture

## System overview

```
React + Vite frontend (FrontEnd/base44/)
        |  fetch/axios + Bearer token, JSON over HTTPS
        v
Laravel 13 REST API (BackEnd/), Sanctum auth
        |  Eloquent
        v
MySQL 8.4 — database `lekkervibes` (127.0.0.1:3307)
```

LekkerVibes is being rebuilt from scratch as a real production system. The
React files under `FrontEnd/base44/` originated as a Base44 (hosted low-code
platform) export and are used as a **visual and component reference only** —
the target is a fully independent frontend with zero runtime dependency on
Base44 services, talking to our own Laravel backend. See
`BASE44_REFERENCE_MAP.md` for the migration inventory.

## Frontend

- **Location:** `FrontEnd/base44/` (folder name is a historical artifact of
  where the Base44 export was consolidated — not a sign the app still runs
  on Base44).
- **Stack:** React 18, Vite 6, React Router 6, TanStack Query 5, Tailwind
  CSS, Radix UI primitives, `class-variance-authority` / `tailwind-merge`
  for variant styling, Framer Motion for animation.
- **Entrypoint:** `src/main.jsx` → `src/App.jsx` (route table + top-level
  auth gate). Path alias `@/` → `./src/*` (see `jsconfig.json`).
- **API client layer:** `src/api/*.js` (being built — see `API.md`), one
  module per resource domain, using TanStack Query for caching/loading/error
  state and a shared `apiClient.js` for the fetch wrapper, auth header
  injection, and error normalization.

## Backend

- **Location:** `BackEnd/` — a standard Laravel 13 application (`composer
  create-project laravel/laravel`).
- **Auth:** Laravel Sanctum, **token-based** (not cookie/SPA mode) — see
  `DECISIONS.md` for why. `User` model uses the `HasApiTokens` trait.
- **Structure:** standard Laravel conventions —
  `app/Models/`, `app/Http/Controllers/Api/**`, `app/Http/Requests/**`,
  `app/Http/Resources/**`, `app/Policies/**`, `app/Services/**`,
  `database/migrations/`, `database/seeders/`, `database/factories/`,
  `routes/api.php`.
- **CORS:** `config/cors.php`, origins restricted via `CORS_ALLOWED_ORIGINS`
  env var (defaults to the local Vite dev server).

## Database

MySQL 8.4, database `lekkervibes`, host `127.0.0.1`, port `3307`. Full
schema in `DATABASE.md`. Never touch the `cap_dashboard` database on the
same server — it belongs to an unrelated application.

## Real-time

No WebSocket transport in v1 — group chat uses TanStack Query polling.
Laravel Reverb is the documented upgrade path (first-party, avoids a
third-party real-time vendor). See `DECISIONS.md`.

## Local ports (development)

| Service | URL |
|---|---|
| Frontend (Vite dev server) | `http://127.0.0.1:5173` |
| Backend (Laravel dev server) | `http://127.0.0.1:8000` |
| MySQL | `127.0.0.1:3307` |

See `LOCAL_SETUP.md` for exact commands.
