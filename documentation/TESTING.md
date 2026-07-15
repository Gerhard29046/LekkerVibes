# Testing

## Backend (`BackEnd/`)

Laravel 13 ships with Pest-compatible PHPUnit config (`phpunit.xml`).

```powershell
cd BackEnd
php artisan test
```

Planned coverage (see `FEATURE_STATUS.md` for what's actually built):
registration, login, logout, profile CRUD, location search, event
filtering/creation/joining, community creation/membership approval, group
messaging permissions (never open DM), reporting, blocking, upload
validation, authorization (policies).

## Frontend (`FrontEnd/base44/`)

```powershell
cd FrontEnd/base44
npm run build     # must succeed
npm run lint       # must pass
npm run typecheck  # jsconfig-based JS type checking
```

No frontend test runner is installed yet (no Vitest/Jest/Playwright in
`package.json`). Once real feature work begins, add one — decision pending
on which (Vitest is the natural fit given Vite).

## Standing rule

Never mark a feature "done" in `FEATURE_STATUS.md` without having actually
run it (test, `php artisan tinker`, a real HTTP request, or a browser
interaction) and observed the result. Mocked/stubbed behavior is reported as
such, not as "working".
