-- SpikeOS initial schema
--
-- This defines the persistence layer the backend will use once
-- DATA_SOURCE moves off "mock". It is NOT currently read by the running
-- API (see backend/app/mock/generator.py for the active in-process mock
-- data) — this migration exists so the schema is agreed, reviewable, and
-- ready before that wiring happens.
--
-- Conventions: UUID primary keys, snake_case, created_at/updated_at on
-- every mutable table, explicit foreign keys with ON DELETE behavior,
-- indexes on foreign keys and frequently-filtered columns.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organization structure
-- ---------------------------------------------------------------------------

create table organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now()
);

create table departments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now(),
    unique (organization_id, name)
);

create table employees (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    department_id uuid references departments(id) on delete set null,
    manager_id uuid references employees(id) on delete set null,
    name text not null,
    title text not null,
    email text not null unique,
    avatar_color text,
    -- Denormalized rollups, refreshed by the scoring worker rather than
    -- computed on every read.
    response_score integer not null default 0,
    median_response_minutes integer not null default 0,
    answered_within_24h_pct integer not null default 0,
    positive_communication_pct integer not null default 0,
    overdue_follow_ups integer not null default 0,
    open_commitments integer not null default 0,
    sla_compliance_pct integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_employees_manager on employees(manager_id);
create index idx_employees_department on employees(department_id);

-- `users` links a login identity (future: Microsoft Entra ID object id) to
-- an employee record and an account type / privilege level. Kept separate
-- from `employees` because administrators may not have an employee record.
create table users (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid references employees(id) on delete cascade,
    account_type text not null check (account_type in ('employee', 'administrator')),
    privilege_level text not null default 'standard' check (privilege_level in ('standard', 'team_lead', 'manager')),
    external_identity_id text unique, -- future Microsoft Entra ID object id
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index idx_users_employee on users(employee_id);

create table customers (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name text not null,
    industry text,
    health text not null default 'steady' check (health in ('strong', 'steady', 'at_risk')),
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Communication data
-- ---------------------------------------------------------------------------

create table mailboxes (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    provider text not null default 'microsoft365',
    external_mailbox_id text,
    created_at timestamptz not null default now()
);

create table email_threads (
    id uuid primary key default gen_random_uuid(),
    mailbox_id uuid not null references mailboxes(id) on delete cascade,
    customer_id uuid references customers(id) on delete set null,
    subject text not null,
    category text not null check (category in ('customer', 'vendor', 'internal')),
    created_at timestamptz not null default now()
);
create index idx_email_threads_mailbox on email_threads(mailbox_id);

create table emails (
    id uuid primary key default gen_random_uuid(),
    thread_id uuid not null references email_threads(id) on delete cascade,
    sender text not null,
    body_preview text,
    priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
    received_at timestamptz not null,
    excluded boolean not null default false,
    exclusion_rule_id uuid, -- references exclusion_rules(id), added below
    created_at timestamptz not null default now()
);
create index idx_emails_thread on emails(thread_id);
create index idx_emails_received_at on emails(received_at);

create table responses (
    id uuid primary key default gen_random_uuid(),
    email_id uuid not null references emails(id) on delete cascade,
    responded_at timestamptz,
    response_time_minutes integer,
    status text not null check (status in ('needs_response', 'waiting', 'completed', 'overdue')),
    quality_score integer,
    next_step text,
    created_at timestamptz not null default now()
);
create index idx_responses_email on responses(email_id);

-- ---------------------------------------------------------------------------
-- Commitments / follow-ups / alerts
-- ---------------------------------------------------------------------------

create table commitments (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    source_email_id uuid references emails(id) on delete set null,
    title text not null,
    source text,
    status text not null check (status in ('active', 'due_today', 'due_this_week', 'overdue', 'completed', 'cancelled')),
    due_date date,
    completed_at timestamptz,
    created_at timestamptz not null default now()
);
create index idx_commitments_employee on commitments(employee_id);
create index idx_commitments_status on commitments(status);

create table followups (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    source_email_id uuid references emails(id) on delete set null,
    contact text,
    subject text,
    due_date date,
    status text not null check (status in ('open', 'overdue', 'due_today', 'completed', 'escalated')),
    last_activity_at timestamptz,
    created_at timestamptz not null default now()
);
create index idx_followups_employee on followups(employee_id);

create table alerts (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    category text not null check (category in ('needs_response', 'overdue', 'commitment', 'follow_up', 'ai_coaching', 'positive_indicator')),
    severity text not null check (severity in ('low', 'medium', 'high')),
    reason text not null,
    recommended_action text,
    occurred_at timestamptz not null default now(),
    dismissed_at timestamptz,
    created_at timestamptz not null default now()
);
create index idx_alerts_employee on alerts(employee_id);

-- ---------------------------------------------------------------------------
-- Performance / scoring
-- ---------------------------------------------------------------------------

create table performance_metrics (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    period_start date not null,
    period_end date not null,
    response_score integer,
    median_response_minutes integer,
    answered_within_24h_pct integer,
    positive_communication_pct integer,
    created_at timestamptz not null default now(),
    unique (employee_id, period_start, period_end)
);
create index idx_performance_metrics_employee on performance_metrics(employee_id);

create table performance_scores (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    response_performance numeric,
    ownership numeric,
    follow_through numeric,
    commitment_completion numeric,
    communication_quality numeric,
    final_score integer,
    computed_at timestamptz not null default now()
);
create index idx_performance_scores_employee on performance_scores(employee_id);

-- ---------------------------------------------------------------------------
-- AI analysis / findings / human review
-- ---------------------------------------------------------------------------

create table ai_analysis (
    id uuid primary key default gen_random_uuid(),
    email_id uuid not null references emails(id) on delete cascade,
    response_required boolean,
    commitment_detected boolean,
    quality_score integer,
    confidence_pct integer,
    reasoning text,
    provider text not null default 'mock', -- 'mock' | 'real'
    created_at timestamptz not null default now()
);
create index idx_ai_analysis_email on ai_analysis(email_id);

create table ai_findings (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    email_id uuid references emails(id) on delete set null,
    finding text not null,
    evidence text,
    ai_confidence_pct integer,
    review_status text not null default 'pending' check (review_status in ('pending', 'confirmed', 'dismissed', 'needs_context')),
    created_at timestamptz not null default now()
);
create index idx_ai_findings_employee on ai_findings(employee_id);

create table reviews (
    id uuid primary key default gen_random_uuid(),
    ai_finding_id uuid not null references ai_findings(id) on delete cascade,
    reviewer_user_id uuid references users(id) on delete set null,
    decision text not null check (decision in ('confirmed', 'dismissed', 'needs_context')),
    decided_at timestamptz not null default now()
);
create index idx_reviews_finding on reviews(ai_finding_id);

create table employee_context (
    id uuid primary key default gen_random_uuid(),
    ai_finding_id uuid not null references ai_findings(id) on delete cascade,
    employee_id uuid not null references employees(id) on delete cascade,
    category text not null check (category in ('pto', 'delegation', 'system_issue', 'customer_delay', 'wrong_classification', 'workload', 'other')),
    description text,
    submitted_at timestamptz not null default now()
);
create index idx_employee_context_finding on employee_context(ai_finding_id);

create table evidence (
    id uuid primary key default gen_random_uuid(),
    finding text not null,
    source text not null,
    rule text,
    evidence_text text,
    context text,
    result text not null check (result in ('confirmed', 'excluded', 'under_review')),
    related_email_id uuid references emails(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Configuration: scoring, exclusions, permissions, integrations
-- ---------------------------------------------------------------------------

create table scoring_rules (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    label text not null,
    value text not null,
    updated_by uuid references users(id) on delete set null,
    updated_at timestamptz not null default now()
);

create table exclusion_rules (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    label text not null,
    description text,
    rule text,
    enabled boolean not null default true,
    updated_by uuid references users(id) on delete set null,
    updated_at timestamptz not null default now()
);

alter table emails
    add constraint fk_emails_exclusion_rule
    foreign key (exclusion_rule_id) references exclusion_rules(id) on delete set null;

create table integration_status (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name text not null,
    status text not null check (status in ('connected', 'not_configured', 'mock_mode', 'error')),
    description text,
    updated_at timestamptz not null default now(),
    unique (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- Audit / notifications / reports
-- ---------------------------------------------------------------------------

create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    actor_user_id uuid references users(id) on delete set null,
    actor_label text not null, -- denormalized display name, survives user deletion
    action text not null,
    resource text not null,
    result text not null check (result in ('success', 'denied')),
    ip_address text,
    created_at timestamptz not null default now()
);
create index idx_audit_logs_org_created on audit_logs(organization_id, created_at desc);

create table notifications (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null references employees(id) on delete cascade,
    channel text not null default 'in_app',
    message text not null,
    sent_at timestamptz,
    read_at timestamptz,
    created_at timestamptz not null default now()
);
create index idx_notifications_employee on notifications(employee_id);

create table reports (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    key text not null,
    title text not null,
    description text,
    generated_at timestamptz,
    generated_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    unique (organization_id, key)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_employees_updated_at before update on employees
    for each row execute function set_updated_at();
create trigger trg_users_updated_at before update on users
    for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled now, policies added once identity flows
-- through Supabase are finalized (Microsoft Entra ID -> FastAPI -> DB role).
-- Until then, all access goes through the FastAPI service role, never
-- directly from the frontend, so RLS is a defense-in-depth layer, not the
-- primary authorization boundary (see docs/SECURITY.md).
-- ---------------------------------------------------------------------------

alter table employees enable row level security;
alter table emails enable row level security;
alter table commitments enable row level security;
alter table followups enable row level security;
alter table alerts enable row level security;
alter table ai_findings enable row level security;
alter table audit_logs enable row level security;
