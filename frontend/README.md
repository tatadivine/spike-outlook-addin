# SpikeOS Frontend (Next.js)

The Next.js frontend for SpikeOS — Communication Effectiveness Platform. Talks
to the FastAPI backend over a typed REST API client; contains no secrets and
no direct third-party integrations.

## Prerequisites

- Node.js 20+
- The backend running locally (see `../backend/README.md`), or a deployed
  backend URL

## Install & run

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`. Two demo sign-in
buttons are provided (Employee / Administrator); once signed in, use the
identity switcher at the bottom of the sidebar to become Sarah Williams
(a manager) without signing out.

## Environment variables

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=SpikeOS
NEXT_PUBLIC_DEMO_MODE=true
```

Only `NEXT_PUBLIC_*` variables are ever read by the browser bundle — nothing
else belongs in this app. Point `NEXT_PUBLIC_API_BASE_URL` at your deployed
Render backend in production.

## Build

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```

## Vercel deployment

- Root directory: `frontend`
- Framework preset: Next.js (auto-detected)
- Build command: `npm run build` (default)
- Environment variable: `NEXT_PUBLIC_API_BASE_URL` pointing at your Render
  backend, e.g. `https://spikeos-api.onrender.com/api/v1`
- The frontend build does not read anything from `../backend` — Vercel only
  needs the `frontend/` directory.

## Architecture notes

- **`src/lib/api/client.ts`** is the only place `fetch()` is called against
  the backend. Every resource (`dashboard.ts`, `communication.ts`, `team.ts`,
  etc.) wraps it with typed methods — components never construct URLs or
  headers themselves.
- **`src/lib/session.tsx`** is the demo identity layer. It persists a chosen
  demo identity to `localStorage` and feeds it to the API client as
  `X-Demo-Account-Type` / `X-Demo-Employee-Id` headers on every request. This
  is the seam that gets replaced by MSAL (Microsoft Authentication Library)
  once Microsoft Entra ID is wired in — see the note in that file.
- **`src/lib/types.ts`** mirrors `backend/app/schemas/domain.py` field for
  field. If you change one, change the other.
- Design system components (`src/components/ui/`) and the Home dashboard
  components (`src/components/dashboard/`) were ported directly from the
  original SpikeOS UI/UX prototype to preserve the agreed visual identity.

## Known simplifications (MVP scope)

- Data fetching uses plain `useEffect` + the typed client on every page,
  rather than a data-fetching library (React Query/SWR) or a deeper Server
  Components migration. This is intentional for the current phase — see the
  note in `eslint.config.mjs` — and is a reasonable next step once the
  product direction is validated.
- The demo identity in `localStorage` is NOT authentication. It must be
  replaced by real Microsoft Entra ID + MSAL before this ships to real
  users; see `src/lib/session.tsx`.
