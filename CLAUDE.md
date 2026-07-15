# LekkerVibes

South African location-aware activity, event and community platform. *"Find
your people. Find your place. Find your vibe."* Not a dating app, hotel
site, nightclub-only platform, or generic ticket marketplace.

This is a **new build from scratch**. The React code under
`FrontEnd/base44/` originated as a Base44 (hosted low-code platform) export
and is used purely as a visual/component reference — target is zero runtime
Base44 dependency. See `documentation/BASE44_REFERENCE_MAP.md`.

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
- Frontend: `@/` alias → `FrontEnd/base44/src/*`. TanStack Query for all
  server state. One `src/api/<domain>Api.js` module per resource domain.
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

Foundation phase: repo restructured, DB schema live, Sanctum installed,
Eloquent models in progress. No feature is yet connected end-to-end between
frontend and backend — see `documentation/FEATURE_STATUS.md` for the
authoritative per-feature status. Do not assume anything not listed there as
✅ actually works.

## Known limitations

- Frontend still runs entirely on the Base44 SDK; migration is file-by-file
  per `documentation/BASE44_REFERENCE_MAP.md`.
- No real-time transport yet (polling planned for v1 messaging).
- No file storage/CDN configured yet.

## File deletion policy

Never delete existing source files, components, pages, or config without
Gerhard's explicit approval. Obsolete files get disconnected from runtime,
marked deprecated in `documentation/BASE44_REFERENCE_MAP.md` or
`FEATURE_STATUS.md`, and left in place pending approval. Generated/
disposable output (`node_modules`, `vendor`, `dist`, framework caches) is
not subject to this rule.
