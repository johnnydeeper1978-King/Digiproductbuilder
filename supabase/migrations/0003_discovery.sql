-- 0003_discovery.sql
-- Discovery sessions, raw answers, opportunities and blueprints.
-- Structured JSON columns hold objects shaped by the existing schemas; the
-- app/edge layer validates against schemas/ before writing. Raw answers are
-- append-only and are NEVER destroyed when processed into AI outputs.

-- ---- discovery_sessions --------------------------------------------------
-- user_id is nullable so a visitor can begin Discovery before authentication
-- (per the journey spec). Anonymous sessions are created/advanced via the
-- server (service role / edge function) and later claimed to a user_id on
-- sign-up; there is intentionally no permissive anon RLS policy.
create table if not exists public.discovery_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  anon_token    uuid not null default gen_random_uuid(),
  status        text not null default 'in-progress'
                check (status in ('in-progress','opportunities-generated',
                                  'opportunity-selected','blueprint-generated',
                                  'complete')),
  user_profile  jsonb,          -- snapshot shaped by user-profile.schema.json
  metadata      jsonb,          -- raw/session metadata
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index if not exists idx_discovery_sessions_user on public.discovery_sessions(user_id);
create index if not exists idx_discovery_sessions_anon on public.discovery_sessions(anon_token);
create index if not exists idx_discovery_sessions_status on public.discovery_sessions(status);
create trigger trg_discovery_sessions_updated_at
  before update on public.discovery_sessions
  for each row execute function public.set_updated_at();

-- ---- discovery_answers ---------------------------------------------------
-- Recoverable raw answers, associated to a session. Kept intact regardless of
-- downstream processing.
create table if not exists public.discovery_answers (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.discovery_sessions(id) on delete cascade,
  question_key   text not null,
  question_text  text,
  answer         jsonb not null,   -- raw answer, any shape
  sequence       integer,
  created_at     timestamptz not null default now()
);
create index if not exists idx_discovery_answers_session on public.discovery_answers(session_id);
create index if not exists idx_discovery_answers_session_seq on public.discovery_answers(session_id, sequence);

-- ---- opportunities -------------------------------------------------------
-- Validated opportunity outputs. `data` holds a full object per
-- opportunity.schema.json. score_overall is a stored (nullable) mirror for
-- querying only — the scoring engine is NOT implemented here.
create table if not exists public.opportunities (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.discovery_sessions(id) on delete cascade,
  opportunity_ref  text,             -- opportunity.id within the output
  data             jsonb not null,   -- opportunity.schema.json object
  is_unexpected    boolean not null default false,
  is_selected      boolean not null default false,
  score_overall    numeric check (score_overall >= 0 and score_overall <= 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_opportunities_session on public.opportunities(session_id);
create index if not exists idx_opportunities_selected on public.opportunities(session_id) where is_selected;
create index if not exists idx_opportunities_unexpected on public.opportunities(session_id) where is_unexpected;
create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---- blueprints ----------------------------------------------------------
-- Validated blueprint outputs. `data` holds a full object per
-- blueprint.schema.json. products.blueprint_id (0004) links a blueprint into
-- the Builder so Discovery is not repeated.
create table if not exists public.blueprints (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid references public.discovery_sessions(id) on delete set null,
  user_id                uuid references auth.users(id) on delete set null,
  source_opportunity_ref text,
  data                   jsonb not null,   -- blueprint.schema.json object
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists idx_blueprints_session on public.blueprints(session_id);
create index if not exists idx_blueprints_user on public.blueprints(user_id);
create trigger trg_blueprints_updated_at
  before update on public.blueprints
  for each row execute function public.set_updated_at();
