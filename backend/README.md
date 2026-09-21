# SpikeOS API (FastAPI backend)

The backend for SpikeOS — Communication Effectiveness Platform. Runs entirely
in **mock mode** with zero external credentials by default.

## Prerequisites

- Python 3.12+
- (Optional) Docker, for container builds

## Install

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API base: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

## Environment variables

See `.env.example`. The only ones that matter for local development are
already defaulted to mock mode:

```
DATA_SOURCE=mock
AI_PROVIDER=mock
POWERBI_PROVIDER=mock
NOTIFICATION_PROVIDER=mock
ANALYTICS_PROVIDER=mock
```

Everything else (`DATABASE_URL`, `MICROSOFT_*`, `POWERBI_*`, `AI_API_KEY`) is
optional until you switch a provider away from mock — see
`app/providers/factory.py`.

## Demo identity headers

There is no real authentication yet. Requests assert who they are via two
headers (this is exactly what a verified Microsoft Entra ID token will
replace — see `app/core/identity.py`):

```
X-Demo-Account-Type: employee | administrator
X-Demo-Employee-Id:  <employee id>   # only relevant when account_type=employee
```

The caller's **role** (employee / team_lead / manager / administrator) is
never taken from these headers — it's looked up server-side in
`app/services/permissions_service.py`, so a client can't grant itself
elevated access.

## Outlook add-in support

Two additional endpoints back the real Outlook side-panel add-in in
`../outlook-addin/` (separate from `/outlook`, which is the in-app preview
on the web dashboard):

- `POST /api/v1/outlook/inbox-summary` — an inbox-shaped summary for the
  signed-in identity. Pass `graph_access_token` in the body to read a live
  Microsoft Graph inbox (only used when `DATA_SOURCE=microsoft`); omit it,
  or leave `DATA_SOURCE=mock`, and it returns that employee's own SpikeOS
  mock alerts shaped like an inbox instead. Never falls back to fabricated
  data — a failed live fetch returns the real mock data with an explicit
  `message` field explaining why, not fake messages pretending to be real.
- `POST /api/v1/outlook/message-context` — classifies a single message
  (subject/sender/body preview) using the same `app/intelligence/exclusions.py`
  and `priority_analyzer.py` used elsewhere in SpikeOS.

Also added: `POST /api/v1/commitments` (the add-in's "Add commitment"
action; the existing `GET /api/v1/commitments` was read-only before this).

New env vars: `OUTLOOK_ADDIN_URL` (added to CORS), `OPENAI_API_KEY` /
`OPENAI_MODEL` (read only when `AI_PROVIDER=real`). `APP_MODE` and
`SUPABASE_SERVICE_ROLE_KEY` are accepted as aliases for `APP_ENV` and
`SUPABASE_SECRET_KEY` respectively — same setting, either name works.

See `../outlook-addin/README.md` for the add-in's own setup, including the
Microsoft Entra app registration needed for live inbox mode.

## Tests

```bash
python -m pytest
```

23 tests cover: health, the mock data generator, exclusion rules, the
scoring engine, hierarchy-based permission checks, and API-level
authorization (403s when a caller reaches outside their authorized scope).
8 more (`test_outlook_addin.py`) cover the Outlook add-in endpoints and
commitment creation — 31 total.

## Linting

```bash
ruff check app tests
```

## Docker

```bash
docker build -t spikeos-api .
docker run -p 8000:8000 --env-file .env spikeos-api
```

## Render deployment

- Root directory: `backend`
- Build: Docker (uses the included `Dockerfile`) — or native Python with
  `pip install -r requirements.txt` and start command
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Set the environment variables listed in `render.yaml` / `.env.example` in
  the Render dashboard — never commit real secrets to the repo.

## Architecture notes

- **Provider abstraction** (`app/providers/`): every external system
  (Microsoft Graph, an AI model, Power BI, notifications, analytics) is
  accessed through an interface (`base.py`). `factory.py` is the *only*
  place that reads `DATA_SOURCE` / `AI_PROVIDER` / etc. to decide which
  concrete class to use. Swapping to a real integration later is an
  environment variable change, not a rewrite of `app/services/*`.
- **Mock data** (`app/mock/`): ~600 employees generated deterministically
  from a seeded PRNG (`seed.py`), plus communications, commitments,
  follow-ups, alerts, customers, AI insights, manager reviews, evidence,
  and an audit log — all built once at import time so every endpoint sees
  the same consistent dataset.
- **Intelligence** (`app/intelligence/`): real, callable, tested functions
  for exclusion-rule evaluation and response scoring (`exclusions.py`,
  `scoring.py`), plus smaller rule-based modules for commitment detection,
  follow-up cadence, communication quality, coaching framing, priority
  inference, and ownership inference. These are genuine logic, not
  placeholders — in `AI_PROVIDER=real` mode, `app/providers/real_stub_providers.py`
  is where an actual model call would replace the heuristic.
- **Authorization** (`app/services/permissions_service.py`,
  `app/core/identity.py`): hierarchy is enforced server-side on every
  route via FastAPI dependencies — an employee cannot fetch another
  employee's data by editing a request, and this is covered by
  `tests/test_api_authorization.py`.
- **No database wiring yet**: the backend currently runs entirely
  in-process against the mock generator. `supabase/migrations` defines the
  schema this data will eventually live in; `app/repositories/` is the
  placeholder layer where Postgres-backed repositories will replace the
  direct `app.mock.generator` calls inside `app/services/*` once
  `DATA_SOURCE` moves off `mock`.

## Known limitations (be honest about these)

- Authentication is a demo header, not Microsoft Entra ID. It must not be
  used as-is in production — see `app/core/identity.py`'s docstring.
- Real Microsoft Graph / Power BI / AI provider classes in
  `app/providers/real_stub_providers.py` raise `NotImplementedError` —
  they are typed placeholders for a future integration phase, not working
  integrations.
- Scoring weights and exclusion rules are held in-memory
  (`settings_service.py`) and reset on restart; they are not yet persisted
  to Postgres.
