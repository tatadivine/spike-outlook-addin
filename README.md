# SpikeOS — Communication Effectiveness Platform

Built for **Spike Electric**. Product owner: Nelson Bonekeh, Operating
Systems Manager. Developer / system architect: Divine Tata.

## 1. What SpikeOS is

SpikeOS measures **communication effectiveness**, not email volume:
responsiveness, ownership, follow-through, commitment completion, and
communication quality — fairly, with context (PTO, delegation, workload)
and evidence behind every metric. AI-assisted findings are always labeled,
always explainable, and always subject to human review before they affect
anyone's performance record.

## 2. What this repository contains

A production-structured monorepo migrated from an earlier Vite/React UI
prototype into:

- **`frontend/`** — Next.js (App Router, TypeScript, Tailwind) → deploys to
  Vercel
- **`backend/`** — FastAPI (Python 3.12) → deploys to Render
- **`outlook-addin/`** — the real Microsoft Outlook side-panel add-in (a
  separate Vite/React app that runs inside Outlook's task pane, not inside
  the browser dashboard) → see `outlook-addin/README.md` for full setup
- **`supabase/`** — PostgreSQL schema (migrations + seed) for the future
  persistence layer
- **`docs/`** — architecture, security, API, data model, deployment, and
  integrations documentation

The running system currently operates entirely in **mock mode** — no
Microsoft, Power BI, AI provider, or database credentials are required to
install, run, and demo the complete product end to end.

## 3. Architecture

See `docs/ARCHITECTURE.md` for the full picture. In short:

```
Next.js (Vercel) --HTTPS/REST--> FastAPI (Render) --> [mock now / Supabase, Microsoft Graph, Power BI, AI provider later]
```

The frontend never talks to a database or a third-party API directly —
everything goes through the typed API client (`frontend/src/lib/api/`)
into FastAPI, which is the only place secrets or sensitive integrations
live.

## 4. Technology stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Recharts, lucide-react |
| Backend | FastAPI, Pydantic v2, pydantic-settings, pytest, ruff |
| Database (future) | Supabase PostgreSQL |
| Auth (future) | Microsoft Entra ID via MSAL |

## 5. Repository structure

```
spikeos-platform/
  frontend/            Next.js app (see frontend/README.md)
  backend/             FastAPI app (see backend/README.md)
  outlook-addin/       Outlook side-panel add-in (see outlook-addin/README.md)
  supabase/
    migrations/        SQL schema
    seed.sql           Representative seed data
    config.toml        Supabase CLI config
  docs/
    ARCHITECTURE.md
    SECURITY.md
    API.md
    DATA_MODEL.md
    DEPLOYMENT.md
    INTEGRATIONS.md
  SUPABASE_SETUP.md
  docker-compose.yml   Local backend convenience only
  .env.example         Documents which vars belong where
```

## 6. Prerequisites

- Node.js 20+
- Python 3.12+
- (Optional) Docker, for container builds or local Supabase

## 7. Local installation — run everything

**Terminal 1 — Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend: http://localhost:8000 · Docs: http://localhost:8000/docs

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3000 — sign in with either demo button, then use
the identity switcher in the sidebar to try Employee, Manager, and
Administrator views.

**(Optional) Terminal 3 — Outlook add-in**, only if you want to try the
real Outlook side panel (separate from the `/outlook` in-app preview on
the web dashboard):

```bash
cd outlook-addin
npm install
cp .env.example .env
npm run dev
```

Full setup — including sideloading it into Outlook, which is more involved
than a normal web app — is in **`outlook-addin/README.md`**.

**(Optional) Terminal 4 — Supabase**, only if you want to explore the
Postgres schema directly (not required for the app to run):

```bash
supabase start
```

See `SUPABASE_SETUP.md` for full detail.

## 8. Mock mode vs. database mode

Today: **mock mode only.** `backend/app/mock/generator.py` builds ~600
employees and all related records once, in-process, from a seeded PRNG.
Every API response comes from this dataset. `DATA_SOURCE=mock` is the
default and requires nothing else.

Future: **database mode.** Once repositories in `backend/app/repositories/`
are implemented against the Supabase schema and `DATA_SOURCE=microsoft` (or
a new `postgres` value) is introduced, the same service layer
(`backend/app/services/*`) would read from Postgres instead — no route or
frontend code changes required, by design (see `docs/ARCHITECTURE.md`'s
provider-abstraction section).

## 9. Adding real credentials later

| Integration | Where | How |
|---|---|---|
| Microsoft Entra ID | `backend/app/core/identity.py` | Replace demo header reading with verified MSAL token claims |
| Microsoft Graph | `backend/app/providers/real_stub_providers.py` | Implement `MicrosoftGraphCommunicationProvider`, set `DATA_SOURCE=microsoft` |
| Power BI | `backend/app/providers/real_stub_providers.py` | Implement `RealPowerBIProvider`, set `POWERBI_PROVIDER=real` |
| AI provider | `backend/app/providers/real_stub_providers.py` | Implement `RealAIProvider`, set `AI_PROVIDER=real`, set `OPENAI_API_KEY`/`OPENAI_MODEL` |
| Outlook add-in live inbox | `outlook-addin/.env` + `backend/app/integrations/microsoft/graph_client.py` | Set `VITE_MICROSOFT_CLIENT_ID`/`VITE_MICROSOFT_TENANT_ID` and `DATA_SOURCE=microsoft` — see `outlook-addin/README.md` |

Full detail in `docs/INTEGRATIONS.md`.

## 10. Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest        # 31 tests: health, mock data, exclusions, scoring, permissions, API authorization, Outlook add-in endpoints
ruff check app tests    # lint
```

## 11. Linting & building

```bash
# Backend
cd backend && ruff check app tests

# Frontend
cd frontend && npm run lint && npm run build
```

## 12. Deployment

See `docs/DEPLOYMENT.md`. Short version: Vercel with root directory
`frontend`, Render with root directory `backend`, connected only by
`NEXT_PUBLIC_API_BASE_URL` / `FRONTEND_URL`.

## 13. Security

See `docs/SECURITY.md`. The short version: authorization is enforced
server-side on every request regardless of what the frontend shows;
authentication is currently a clearly-labeled demo mechanism, not
production security, pending Microsoft Entra ID integration.

## 14. Troubleshooting

- **Frontend shows network errors / spinners that never resolve** — is the
  backend running on the port `NEXT_PUBLIC_API_BASE_URL` points at? Check
  `frontend/.env.local`.
- **CORS errors in the browser console** — confirm `FRONTEND_URL` in
  `backend/.env` matches the exact origin the frontend is served from.
- **`403 FORBIDDEN` when switching identities** — expected if you try to
  view someone outside your current demo identity's authorized scope
  (e.g. Employee viewing `/organization`). Switch to Sarah Williams
  (manager) or the Administrator to see broader views.
- **Backend won't start** — confirm Python 3.12+, and that you activated
  the virtualenv before `pip install`.
- **Outlook add-in won't load / shows a certificate warning** — expected on
  first run; Office add-ins require HTTPS even on localhost. See
  `outlook-addin/README.md`'s certificate-trust step.

## 15. Honest current limitations

- Authentication is a demo mechanism (see `docs/SECURITY.md`).
- Microsoft Graph, Power BI, and the AI provider are mocked; their real
  implementations are typed placeholders (`backend/app/providers/real_stub_providers.py`)
  that raise `NotImplementedError` rather than pretending to work.
- The backend does not yet read from Postgres — the Supabase schema is
  ready, but repositories are not yet wired to it.
- The Outlook add-in's live inbox mode (real Microsoft Graph reads) works
  once Entra credentials and consent are in place; without them it falls
  back to that employee's own SpikeOS mock inbox, never fabricated data —
  see `outlook-addin/README.md`.
- Frontend data fetching uses plain `useEffect` rather than a dedicated
  data-fetching library or a deeper Server Components migration — a
  reasonable next step, not a blocker for this phase.
