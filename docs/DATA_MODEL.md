# Data Model

Two data models exist side by side right now, deliberately:

1. **The running mock model** (`backend/app/mock/generator.py`) — plain
   Python dicts, held in process memory, built once at startup from a
   seeded PRNG. This is what every API response currently comes from.
2. **The Postgres schema** (`supabase/migrations/0001_initial_schema.sql`)
   — the future persistence layer, not yet read by the running API. It
   exists now so the schema is reviewable and the migration path is clear.

The two are intentionally similar in shape (an `Employee` row's fields map
closely to the `employees` table's columns) so that wiring the backend to
Postgres later is a repository-layer change, not a schema redesign.

## Core entities

- **organizations / departments / employees** — the org chart. `employees`
  self-references via `manager_id` for the reporting hierarchy that
  `permissions_service.py` walks.
- **users** — a login identity (account type + privilege level), separate
  from `employees` because an administrator may not have an employee
  record. `external_identity_id` is where a Microsoft Entra ID object id
  will live.
- **customers** — external accounts communications are tracked against.
- **mailboxes / email_threads / emails / responses** — the communication
  record: one mailbox per employee, threads within a mailbox, individual
  emails within a thread, and a response record capturing status/timing/
  quality once a reply happens.
- **commitments / followups / alerts** — the three action-oriented views
  derived from communications.
- **performance_metrics / performance_scores** — point-in-time rollups
  (a period snapshot) versus the latest computed score breakdown
  (mirrors `backend/app/intelligence/scoring.py`'s `ScoreBreakdown`).
- **ai_analysis / ai_findings / reviews / employee_context** — the AI
  transparency chain: a finding is generated with a confidence and
  reasoning, a human review decision is recorded separately (never
  overwriting the finding), and an employee's context submission is its
  own row, linked to the finding it responds to.
- **evidence** — the traceability record shown in the Evidence Center,
  optionally linked to the source email.
- **scoring_rules / exclusion_rules / integration_status** — the
  configuration tables backing `/settings/*`.
- **audit_logs** — every configuration change and review decision.
  `actor_label` is denormalized (stored as text, not just a foreign key)
  so the audit trail survives a user being deleted.
- **notifications / reports** — outbound notification records and the
  report catalog shown on `/reports`.

## Field naming

The Postgres schema uses `snake_case` throughout, matching
`backend/app/schemas/domain.py`'s Pydantic field names, which in turn
match `frontend/src/lib/types.ts` field-for-field. There is no camelCase
conversion layer anywhere in this stack — the wire format, the Python
model, and the eventual database column all use the same name for the
same concept.
