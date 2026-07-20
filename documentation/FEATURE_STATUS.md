# Feature Status

Last reviewed against source: 2026-07-20.

This file distinguishes implementation from live browser verification.
`FrontEnd/base44/src/lib/featureFlags.js` is the source of truth for what
the current UI exposes.

Legend: ✅ implemented/enabled · 🟨 partial or needs live verification ·
⬜ disabled/not complete · 🗃️ disconnected reference

## Active Firebase/Worker Application

| Area | Status | Current source state |
|---|---|---|
| Email/password authentication | ✅ | Firebase Auth |
| Google authentication | ✅ | Popup flow implemented |
| User profiles and editing | ✅ | Firestore-backed |
| Settings and privacy controls | ✅ | Firestore-backed panels |
| FCM browser registration | 🟨 | Implemented; requires browser/device verification |
| Places discovery | ✅ | Google Places proxied and cached by Worker |
| Location preferences | ⬜ | `FEATURES.locations` is false |
| Communities | ✅ | Create/edit/join/leave, invite policies, roles and moderation |
| Community following | ✅ | Separate from active membership |
| Activities/events | ✅ | Create/edit/cancel, visibility, RSVP, capacity and waitlist |
| Invite-link events | ✅ | Token resolution through Worker |
| Saved activities/places | ✅ | Firestore-backed |
| Visited places | ✅ | Explicit-action recording only |
| Community/event chat | ✅ | Firestore real-time listeners |
| Rich Messages UI | ✅ | Images, reactions, announcements, pins and unread state |
| Direct messages | N/A | Intentionally prohibited |
| Follow requests | ✅ | Approval flow; Worker performs atomic acceptance |
| Social-link reveal | ✅ | Per-platform request/approval flow |
| Notifications inbox | ✅ | Firestore-backed |
| Automatic web-push dispatch | 🟨 | Worker can send; not every product event triggers push |
| Reports | ✅ | Client submission and staff-readable queue rules |
| Blocking | ⬜ | Worker cascade exists; UI flag remains false pending full enforcement verification |
| Broader moderation | 🟨 | Role changes and message deletion exist; warn/mute/ban flows are incomplete |
| Data export | 🟨 | Request flag exists; export generation/delivery is not complete |
| Account deletion | ⬜ | UI marks it coming soon |

## Validation

| Check | Result |
|---|---|
| Frontend production build | ✅ |
| Frontend ESLint | ✅ |
| Frontend gradual typecheck | ✅ |
| Worker TypeScript check | ✅ |
| Frontend automated browser tests | ⬜ No Playwright/Vitest suite yet |
| Firebase rules emulator tests | ⬜ Not yet present |
| Laravel PHPUnit | 🗃️ Reference backend; run separately when PHP is available |

## Known Technical Work

- Add Playwright coverage for authentication, profile, community, event,
  messaging, relationships, reporting, and blocking journeys.
- Add Firebase Emulator tests for Firestore and Storage rules.
- Verify every enabled feature against the deployed Firebase/Worker
  environment, especially FCM and Google OAuth.
- Complete blocking enforcement before turning `FEATURES.blocks` on.
- Move consistency-sensitive multi-document client operations into trusted
  Worker transactions where appropriate.
- Add route-level lazy loading; the current frontend bundle is large.
- Decide whether `BackEnd/` should be archived or restored to active use.

## Disconnected Laravel/MySQL Implementation

The Laravel backend contains implemented APIs, models, migrations, seeders,
policies, and tests for auth, profiles, locations, events, communities,
messaging, uploads, reports, blocks, saved items, and notifications. It is
not used by the active frontend or live deployment.
