# Architecture

```
USERS
  |
  v
+----------------+
| VERCEL         |
| Next.js        |
| FRONTEND       |
+-------+--------+
        | HTTPS REST API (typed client, src/lib/api/*)
        v
+----------------+
| RENDER         |
| FastAPI        |
| BACKEND        |
+-------+--------+
        |
        +-----------+------------+
        |           |            |
        v           v            v
   Supabase   Microsoft Graph  AI Provider
   PostgreSQL  (future)         (future)
        |
        v
   Microsoft 365 (future, via Graph)

Power BI is embedded INSIDE the Next.js frontend (/analytics); sensitive
Power BI operations (embed token generation) are handled by FastAPI, never
directly by the browser.
```

## Why this shape

- **Frontend and backend are independently deployable.** Vercel only ever
  needs `frontend/`; Render only ever needs `backend/`. Neither build step
  reads the other directory. This is enforced structurally (separate
  `package.json` / `requirements.txt`, separate git-ignorable build
  artifacts) rather than by convention alone.
- **All sensitive integrations are backend-only.** Microsoft Graph, Power BI
  embed tokens, the AI provider, and the database connection are only ever
  reachable from FastAPI. The frontend holds zero secrets — see
  `frontend/.env.example` (only `NEXT_PUBLIC_*` values) versus
  `backend/.env.example` (everything else).
- **Provider abstraction, not scattered mocks.** Every external system is
  accessed through an interface in `backend/app/providers/base.py`.
  `backend/app/providers/factory.py` is the only place that reads
  `DATA_SOURCE` / `AI_PROVIDER` / etc. to pick a concrete implementation.
  Switching from mock to a real integration is a Render environment
  variable change, not an application rewrite.
- **Authorization is server-side.** The frontend's demo role switcher is
  exactly that — a demo convenience. Every FastAPI route depends on
  `get_current_identity` (`backend/app/core/identity.py`) and checks
  hierarchy via `backend/app/services/permissions_service.py`. A person
  cannot see another person's data by editing the frontend or the request;
  this is covered by `backend/tests/test_api_authorization.py`.
- **Mock-first, deterministic.** `backend/app/mock/generator.py` builds the
  entire ~600-employee dataset once, from a seeded PRNG, at process start.
  Every endpoint reads from the same in-memory dataset, so the same
  employee looks the same whether you're looking at their communication
  list, their team's roster, or the audit log — there is exactly one
  source of mock truth, not one per page.

## Directories

```
spikeos-platform/
  frontend/     Next.js (App Router) -> Vercel
  backend/      FastAPI -> Render
  outlook-addin/  Vite/React Office Add-in -> any static host (runs inside Outlook, not a browser tab)
  supabase/     Postgres schema (migrations + seed) — not yet wired to the running API
  docs/         This directory
```

See `backend/README.md`, `frontend/README.md`, and `outlook-addin/README.md`
for directory-level detail on each app.

## A third client, same backend

`outlook-addin/` is a genuinely separate deployable — its own `package.json`,
its own build, its own hosting — not a page inside `frontend/`. It talks to
the same FastAPI backend as the web dashboard, using the same demo identity
headers (`X-Demo-Account-Type` / `X-Demo-Employee-Id`) today, and will move
to the same real Entra ID token once that ships (one identity boundary,
enforced in one place: `backend/app/core/identity.py`). It additionally
carries its own, narrower concern — a Microsoft Graph-scoped token it
acquires itself to read live mailbox content — see
`backend/app/integrations/microsoft/graph_client.py` and
`docs/INTEGRATIONS.md`.
