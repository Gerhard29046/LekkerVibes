# Local Setup

## Prerequisites (already present on this machine via Laragon)

- PHP 8.3 — `C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe`
- Composer 2.9 — `C:\laragon\bin\composer\composer.bat`
- MySQL 8.4 — `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`, running on `127.0.0.1:3307`
- Node.js v26 / npm 11

None of `php`, `composer`, `mysql` are on the default shell `PATH`. Prepend
them for a session:

```powershell
$env:PATH = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:PATH
```

## Backend (`BackEnd/`)

```powershell
cd BackEnd
composer install
copy .env.example .env   # already done for the tracked repo; .env itself is gitignored
php artisan key:generate # already run once — APP_KEY is set in the local .env
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

DB connection (already set in `BackEnd/.env`):

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=lekkervibes
DB_USERNAME=root
DB_PASSWORD=
```

**Never** point `DB_DATABASE` at `cap_dashboard` — that belongs to an
unrelated application on the same MySQL server.

## Frontend (`FrontEnd/base44/`)

```powershell
cd FrontEnd/base44
npm install
npm run dev      # Vite dev server, http://127.0.0.1:5173
npm run build    # production build -> dist/
npm run lint
```

Frontend env (create `FrontEnd/base44/.env.local`, not committed):

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Running both together

Two terminals: `php artisan serve` in `BackEnd/`, `npm run dev` in
`FrontEnd/base44/`. CORS is pre-configured for `http://127.0.0.1:5173` and
`http://localhost:5173` (see `BackEnd/config/cors.php`).

## Database archive

A full export of the previous (abandoned) `lekkervibes` schema+data lives at
`documentation/db-archive/lekkervibes_old_backup_2026-07-15.sql`, taken
before the reset authorized in the project brief. Reference only — the new
schema is designed independently (see `DATABASE.md`, `DECISIONS.md`).
