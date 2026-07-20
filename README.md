# LekkerVibes

LekkerVibes is a South African, location-aware platform for discovering
places, joining communities, and creating or attending activities.

> Find your people. Find your place. Find your vibe.

The live application uses React, Firebase, and a Cloudflare Worker. The
`FrontEnd/base44/` directory name reflects the original UI export; Base44
is not part of the active runtime.

## Repository

```text
FrontEnd/base44/  React 18 + Vite frontend
Firebase/         Firestore indexes/rules and Storage rules
Worker/           Hono Cloudflare Worker
BackEnd/          Disconnected Laravel/MySQL reference implementation
documentation/    Architecture, API, decisions, setup, and status
```

## Local Development

Copy the example environment file and provide the Firebase, Worker, and
VAPID values used by your environment:

```powershell
Copy-Item FrontEnd/base44/.env.example FrontEnd/base44/.env.local
```

Start the frontend:

```powershell
cd FrontEnd/base44
npm install
npm run dev
```

Start the Worker in another terminal:

```powershell
cd Worker
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:5173`. The local Worker defaults
to `http://127.0.0.1:8787`.

## Validation

```powershell
cd FrontEnd/base44
npm run build
npm run lint
npm run typecheck

cd ../../Worker
npm run typecheck
```

JavaScript uses gradual type checking: build and ESLint cover the entire
frontend, while JavaScript files can opt into TypeScript diagnostics with
`// @ts-check`.

## Deployment

- Frontend: Cloudflare Pages
- API Worker: Cloudflare Workers via Wrangler
- Data/Auth/Storage/Messaging: Firebase

Vite environment variables are embedded at build time. Ensure all
`VITE_FIREBASE_*`, `VITE_FIREBASE_VAPID_KEY`, and `VITE_API_BASE_URL`
values are configured in the build environment before deploying.

Never commit `.env.local`, Worker secrets, Firebase service-account
credentials, or API keys.

See [local setup](documentation/LOCAL_SETUP.md),
[architecture](documentation/ARCHITECTURE.md), and
[feature status](documentation/FEATURE_STATUS.md) for more detail.
