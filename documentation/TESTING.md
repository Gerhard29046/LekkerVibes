# Testing

## Backend (`BackEnd/`)

Plain PHPUnit (not Pest), configured in `phpunit.xml` to run against an
in-memory SQLite database (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`)
— tests never touch the real `lekkervibes` MySQL database.

```powershell
$env:PATH = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:PATH
cd BackEnd
php artisan test
```

34 tests / 120 assertions, all passing, covering:

| Suite | File | Covers |
|---|---|---|
| Auth | `tests/Feature/Auth/AuthenticationTest.php` | register (+ cascade-creates profile/privacy/notification/transport rows), validation, login (success/failure), `/api/auth/me`, 401 on missing auth, logout token revocation |
| Profile | `tests/Feature/Profile/ProfileTest.php` | view bundle, field updates, unique-username validation, interest sync, 401 when unauthenticated |
| Events | `tests/Feature/Events/EventTest.php` | guests see only published events, creation with occurrences, occurrence-required validation, organiser-only update (403 for others), join/leave with `spots_remaining` bookkeeping, save/unsave |
| Communities | `tests/Feature/Communities/CommunityTest.php` | creation auto-creates organiser membership + welcome_group conversation, open-join, request-to-join (pending request, no membership yet), membership-request visibility restricted to organiser/moderator, approval creates active membership + increments `member_count` |
| Messaging | `tests/Feature/Messaging/MessagingTest.php` | non-members get 403 on view/send, members can send/list, delete leaves an `is_deleted` placeholder (not a hard delete), non-sender can't delete another member's message |
| Safety | `tests/Feature/Safety/SafetyTest.php` | report creation, admin-only report listing/resolution, block/unblock, self-block rejected |

A Sanctum-specific testing gotcha is documented inline in
`AuthenticationTest::test_logout_revokes_the_current_token` — Laravel's auth
guard caches the resolved user within a single test method's app container,
so a second authenticated request in the same test needs
`$this->app['auth']->forgetGuards()` before it will actually re-check a
revoked token instead of reusing the cached auth state from the first
request. This is a test-harness artifact, not a production bug (already
confirmed separately via live manual testing against the running dev
server).

## Frontend (`FrontEnd/base44/`)

```powershell
cd FrontEnd/base44
npm run build     # must succeed
npm run lint       # must pass
npm run typecheck  # jsconfig-based JS type checking — has pre-existing
                    # implicit-any noise from ui/ components not being
                    # checked (jsconfig excludes them); not a regression,
                    # not currently worth chasing
```

No frontend test runner is installed yet (no Vitest/Jest/Playwright in
`package.json`). Every page was instead verified by:
1. `npm run build` / `npm run lint` passing clean.
2. Fetching each edited file through the Vite dev server's transform
   pipeline (catches syntax/import errors a production build might tree-
   shake around).
3. Live HTTP requests against the running backend reproducing exactly what
   each page's data-fetching code does (register → profile → create event →
   create community → resolve its welcome-group conversation, etc.).

This is **not** the same as driving a real browser and clicking through the
UI — no visual/interaction verification has been done. Add Vitest +
Testing Library (or Playwright for true browser E2E) as a follow-up; Vitest
is the natural fit given Vite.

## Standing rule

Never mark a feature "done" in `FEATURE_STATUS.md` without having actually
run it (test, `php artisan tinker`, a real HTTP request, or a browser
interaction) and observed the result. Mocked/stubbed behavior is reported as
such, not as "working".
