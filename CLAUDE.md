# LekkerVibes

South African location-aware activity, event and community platform. *"Find
your people. Find your place. Find your vibe."* Not a dating app, hotel
site, nightclub-only platform, or generic ticket marketplace.

This is a **new build from scratch**. The React code under
`FrontEnd/base44/` originated as a Base44 (hosted low-code platform) export
and was used as a visual/component reference — **zero runtime Base44
dependency achieved**: `@base44/sdk` and `@base44/vite-plugin` are fully
removed. See `documentation/BASE44_REFERENCE_MAP.md`.

## Architecture

```
React + Vite (FrontEnd/base44/) → Laravel 13 REST API (BackEnd/) → MySQL `lekkervibes`
```

Full detail: `documentation/ARCHITECTURE.md`. Schema: `documentation/
DATABASE.md`. API contract: `documentation/API.md`. Decisions log:
`documentation/DECISIONS.md`. Setup: `documentation/LOCAL_SETUP.md`.
Feature status: `documentation/FEATURE_STATUS.md`.

## Active paths

- Frontend: `FrontEnd/base44/` (Vite root — `package.json`, `vite.config.js`,
  `src/` all live here)
- Backend: `BackEnd/` (Laravel 13)
- Agent team: `.claude/agents/` (22 project-specific subagents — jarvis-lead
  coordinates, delegates to the rest)

## Database

MySQL 8.4 at `127.0.0.1:3307`, database **`lekkervibes`**.

**Safety rule: `cap_dashboard` on the same MySQL server belongs to an
unrelated application. Never create, drop, alter, seed, or query it for
anything LekkerVibes-related. Always verify the selected database is
exactly `lekkervibes` before any destructive operation.**

## Setup & test commands

See `documentation/LOCAL_SETUP.md` and `documentation/TESTING.md` for full
detail. Quick reference:

```powershell
# PHP/Composer/MySQL aren't on PATH by default:
$env:PATH = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:PATH

cd BackEnd; php artisan serve --host=127.0.0.1 --port=8000
cd FrontEnd/base44; npm run dev
```

## Coding conventions

- Backend: standard Laravel conventions, PHP 8 attribute-based model config
  (`#[Fillable]`, `#[Hidden]` — see `app/Models/User.php`), Form Requests
  for validation, API Resources for response shaping, Policies for
  authorization. No business logic in controllers beyond orchestration.
- Frontend: `@/` alias → `FrontEnd/base44/src/*` (configured directly in
  `vite.config.js` `resolve.alias` — not provided by any plugin). One
  `src/api/<domain>Api.js` module per resource domain, all built on the
  shared `apiClient.js` fetch wrapper. `@tanstack/react-query` is installed
  and a `QueryClientProvider` wraps the app, but pages currently fetch via
  plain `useState`/`useEffect` calling the `*Api.js` modules directly, not
  `useQuery`/`useMutation` — migrating pages to TanStack Query hooks (for
  caching, refetch-on-focus, mutation state) is a worthwhile follow-up, not
  done yet.
- Auth: Sanctum **token-based** (Bearer header), not cookie/SPA mode — see
  `documentation/DECISIONS.md`.
- Messaging is group/community-based only — never build unrestricted 1:1
  direct messaging.

## Visual system

Coastal Community aesthetic — alive, warm, modern, youthful, premium, local,
outdoorsy, safe. Palette: `#164E63` `#0F766E` `#7DD3FC` `#F97366` `#FDBA8C`
`#F7F1E8` `#FFFDF8` `#65A30D` `#1F2933`. Motion (sliding nav, animated
drawers, bottom sheets, page transitions, scroll reveals, skeleton loaders)
must respect `prefers-reduced-motion` and stay performant.

## Current milestone

Core platform is live end-to-end: full Laravel API (auth, profile,
locations, interests, events/activities, communities/memberships,
messaging, uploads, reports, blocks, saved, notifications), and the
existing frontend pages (public site + the Base44-era signed-in pages) are
all wired to it — **zero runtime Base44 dependency remains** (`@base44/sdk`
and `@base44/vite-plugin` removed from `package.json`). See
`documentation/FEATURE_STATUS.md` for the authoritative per-feature status —
do not assume anything not listed there as ✅ actually works. Next up: the
`/app/*` signed-in app shell from the product brief (current signed-in
pages live at top-level routes, not under a bottom-nav `/app` shell),
automated tests (everything so far was verified via live manual testing
against the dev servers), and TanStack Query adoption.

## Known limitations

- No real-time transport yet (polling planned for v1 messaging, 4s interval
  in `GroupChat.jsx`).
- No automated test suite (backend Pest/PHPUnit or frontend Vitest/
  Playwright) — see `documentation/FEATURE_STATUS.md` for what was
  live-tested instead.
- Blocking is recorded but not enforced; notifications API exists but
  nothing dispatches a notification yet; no recurring-event occurrence
  generation; no venue-creation flow. Full list in
  `documentation/FEATURE_STATUS.md`.

## File deletion policy

Never delete existing source files, components, pages, or config without
Gerhard's explicit approval. Obsolete files get disconnected from runtime,
marked deprecated in `documentation/BASE44_REFERENCE_MAP.md` or
`FEATURE_STATUS.md`, and left in place pending approval. Generated/
disposable output (`node_modules`, `vendor`, `dist`, framework caches) is
not subject to this rule.
