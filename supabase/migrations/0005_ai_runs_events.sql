-- 0005_ai_runs_events.sql
-- Auditable AI execution records + a generic application event log.
-- NEVER store provider secrets/credentials here — only references + metadata.

create table if not exists public.ai_runs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  session_id        uuid references public.discovery_sessions(id) on delete set null,
  run_type          text not null,   -- e.g. discovery_profile, opportunity_generation, blueprint_generation
  provider          text check (provider in ('openai','anthropic','perplexity')),
  model             text,
  status            text not null default 'pending'
                    check (status in ('pending','running','succeeded','failed')),
  input_metadata    jsonb,           -- references/metadata only, no secrets
  output            jsonb,
  validation_status text not null default 'not_validated'
                    check (validation_status in ('not_validated','valid','invalid')),
  error_code        text,
  error_message     text,
  started_at        timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists idx_ai_runs_user on public.ai_runs(user_id);
create index if not exists idx_ai_runs_session on public.ai_runs(session_id);
create index if not exists idx_ai_runs_status on public.ai_runs(status);

-- Generic event/audit log. `type` is intentionally free text (extensible);
-- known types include discovery_started, discovery_completed,
-- blueprint_generated, builder_started, builder_completed, purchase_completed,
-- workforce_application, call_booked. Workflows are NOT implemented here.
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  session_id  uuid references public.discovery_sessions(id) on delete set null,
  type        text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_events_user on public.events(user_id);
create index if not exists idx_events_type on public.events(type);
create index if not exists idx_events_created on public.events(created_at);
