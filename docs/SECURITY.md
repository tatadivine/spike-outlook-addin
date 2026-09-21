# Security

## Authentication (current state — read this first)

**There is no production authentication in this build.** The frontend's
sign-in screen and identity switcher (`frontend/src/lib/session.tsx`) set
two headers (`X-Demo-Account-Type`, `X-Demo-Employee-Id`) that the backend
reads in `backend/app/core/identity.py`. This is clearly labeled "Demo
Environment" everywhere it appears in the UI and must never be mistaken
for real security. Production authentication will be Microsoft Entra ID,
verified via MSAL, replacing `identity.py`'s header-reading with real
token verification — no other file needs to change, because every route
already depends on `get_current_identity` rather than reading headers
directly.

## Authorization is server-side, not frontend-side

The frontend hides navigation items a person isn't supposed to use (see
`frontend/src/components/layout/nav.ts`), but **this is UX, not security**.
Every FastAPI route re-derives the caller's role server-side
(`backend/app/services/permissions_service.py::role_for`) from data the
backend controls (a privilege table), never from anything the client
sends. Hierarchy checks (`can_view_employee`, `visible_employee_ids`) run
on every team/employee/communication/commitment/follow-up/alert/coaching
endpoint. `backend/tests/test_api_authorization.py` exercises this
directly — e.g. an employee requesting another employee's communications
gets a `403 FORBIDDEN`, not filtered client-side data.

## CORS

`backend/app/main.py` configures CORS from `FRONTEND_URL` (plus
`http://localhost:3000` for local development) — never `allow_origins=["*"]`.
Add additional trusted origins (e.g. a Vercel preview URL) by extending
`_allowed_origins` in that file, driven by environment configuration
rather than hardcoding on top of `*`.

## Secrets

- Frontend: only `NEXT_PUBLIC_*` variables exist, and none of them are
  secret — see `frontend/.env.example`.
- Backend: `backend/.env.example` lists every secret the app might need
  (Microsoft, Power BI, AI provider, Supabase service role key, JWT
  secret). None of these are required for `DATA_SOURCE=mock` /
  `AI_PROVIDER=mock`, which is the default.
- Nothing in this repository contains real credentials. `.env` files are
  git-ignored; only `.env.example` files are committed.

## Error handling

`backend/app/main.py` registers exception handlers that return a
consistent envelope (`{"error": {"code", "message", "request_id"}}`) and
log the real exception server-side — stack traces, credentials, and
internal details are never returned to the client. See
`backend/app/core/errors.py`.

## Audit logging

Administrative and review actions are recorded via
`backend/app/services/audit_service.py` (scoring rule changes, exclusion
rule changes, permission grants, AI finding review decisions). Message
content is never written to the audit log — only who did what, to which
resource, and when.

## Human review of AI findings

AI-generated findings (`ai_finding` on a communication, `Review` records)
carry a `review_status` that starts as `pending` and can only move to
`confirmed` / `dismissed` / `needs_context` through an explicit,
audited manager action (`PATCH /api/v1/reviews/{id}`,
`backend/app/services/review_service.py::apply_decision`). Nothing marks a
finding as a final negative performance outcome automatically.

## Row Level Security

The Supabase schema (`supabase/migrations/0001_initial_schema.sql`) enables
RLS on the sensitive tables now, so it is not an afterthought once the
backend is wired to Postgres. Policies are intentionally not yet defined —
until Microsoft Entra ID identity flows through to a Postgres role per
request, RLS policies would either be wrong or would have to duplicate the
FastAPI authorization logic in SQL. The FastAPI service role is the
authorization boundary today; RLS is documented here as the
defense-in-depth layer to complete once that identity plumbing exists.

## Known gaps (be honest about these)

- No production authentication (see above).
- No rate limiting is implemented yet (only documented as an intended
  abstraction — see `docs/ARCHITECTURE.md`'s provider-abstraction pattern
  for where this would plug in).
- Postgres is not yet the live data source; the mock generator holds
  everything in-process, so there is currently nothing in a database to
  secure via RLS in the running system.
