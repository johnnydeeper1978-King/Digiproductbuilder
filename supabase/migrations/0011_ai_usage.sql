-- 0011: AI usage tracking + stable opportunity refs.
alter table public.ai_runs
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists est_cost_usd numeric(10,6),
  add column if not exists stop_reason text;

create index if not exists ai_runs_created_at_idx on public.ai_runs (created_at);
create index if not exists ai_runs_session_type_idx on public.ai_runs (session_id, run_type, status);
create index if not exists ai_runs_user_created_idx on public.ai_runs (user_id, created_at);

-- discovery -> select looks opportunities up by (session_id, opportunity_ref).
create unique index if not exists opportunities_session_ref_uidx
  on public.opportunities (session_id, opportunity_ref)
  where opportunity_ref is not null;
