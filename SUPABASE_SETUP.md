# Supabase Setup

SpikeOS uses **Supabase PostgreSQL as a database only** — not Supabase Auth.
Authentication is (and will remain, until a later phase) Microsoft Entra ID.

The running backend in this repository currently operates entirely in
**mock mode** (`DATA_SOURCE=mock`) and does not require Supabase to be
running at all. This guide is for when you want to explore the schema
directly, or begin wiring the backend to Postgres.

## 1. Install the Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (any OS)
npm install -g supabase

# or see https://supabase.com/docs/guides/cli/getting-started
```

## 2. Install a Docker-compatible runtime

The Supabase CLI runs Postgres, Studio, and supporting services in
containers. Install Docker Desktop (or a compatible runtime such as
OrbStack or Colima) and make sure it's running before continuing.

## 3. Initialize (already done in this repo)

This repository already contains `supabase/config.toml`,
`supabase/migrations/`, and `supabase/seed.sql`. If you were starting from
scratch, this step would be:

```bash
supabase init
```

## 4. Start Supabase locally

From the repository root:

```bash
supabase start
```

This prints local connection details, including:

- API URL (e.g. `http://127.0.0.1:54321`)
- DB URL (e.g. `postgresql://postgres:postgres@127.0.0.1:54322/postgres`)
- Studio URL (e.g. `http://127.0.0.1:54323`)
- anon / service_role keys

## 5. Run migrations

```bash
supabase migration up
```

This applies everything in `supabase/migrations/` — currently
`0001_initial_schema.sql`, which creates the full SpikeOS schema
(organizations, departments, employees, users, customers, mailboxes,
email_threads, emails, responses, commitments, followups, alerts,
performance_metrics, performance_scores, ai_analysis, ai_findings, reviews,
employee_context, evidence, scoring_rules, exclusion_rules,
integration_status, audit_logs, notifications, reports).

## 6. Run seed data

```bash
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/seed.sql
```

Or more simply, seed data runs automatically the next time you do a full
reset (step 8) since Supabase applies `supabase/seed.sql` after migrations.

## 7. Open Supabase Studio

Visit the Studio URL printed by `supabase start` (typically
http://127.0.0.1:54323) to browse tables, run SQL, and inspect data
visually.

## 8. Resetting the database

```bash
supabase db reset
```

This drops and recreates the local database, re-applies all migrations,
and re-runs `supabase/seed.sql` — the fastest way to get back to a known
state during development.

## 9. Applying migrations to a remote (staging/production) project

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`supabase db push` applies any migrations not yet present on the linked
remote project. Always review the diff it prints before confirming.

## 10. Generating types (optional)

```bash
supabase gen types typescript --local > frontend/src/lib/supabase-types.ts
```

Not currently used by the frontend (which talks to FastAPI, not Supabase,
directly) but useful if the backend later exposes typed repository code
generated from the schema.

## 11. Environment variables

Once the backend is wired to Postgres, set in `backend/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<anon key from `supabase start` output>
SUPABASE_SECRET_KEY=<service_role key from `supabase start` output>
```

Never put `SUPABASE_SECRET_KEY` (the service role key) anywhere the
frontend can read it — it bypasses Row Level Security entirely and must
stay backend-only.

## 12. Local development workflow

Day to day, most changes don't need Supabase running at all
(`DATA_SOURCE=mock`). When you do need it:

```bash
supabase start          # once per session
supabase db reset        # after changing a migration
```

## 13. Staging

Create a separate Supabase project for staging, `supabase link` to it, and
`supabase db push` your migrations. Keep staging's seed data separate from
production — do not run `supabase/seed.sql` (which contains illustrative
names) against a real customer's project.

## 14. Production considerations

- Never run `supabase/seed.sql` against production.
- Row Level Security is enabled on the sensitive tables in the initial
  migration, but policies are not yet defined — see the comment at the
  bottom of `0001_initial_schema.sql`. Until Microsoft Entra ID identity
  flows through to Postgres roles, the FastAPI service role is the
  authorization boundary (enforced in `backend/app/services/permissions_service.py`),
  not RLS — see `docs/SECURITY.md`.
- Rotate the service role key if it is ever exposed, and audit who has
  access to it.
