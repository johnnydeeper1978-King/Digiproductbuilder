-- 0014: structured Discovery interview + AI checkpoints; tool catalogue fields
-- the Builder needs to teach tool usage.
alter table public.discovery_answers
  add column if not exists source text not null default 'bank';
alter table public.discovery_answers drop constraint if exists discovery_answers_source_check;
alter table public.discovery_answers add constraint discovery_answers_source_check
  check (source in ('bank', 'ai_followup', 'legacy'));

-- { "checkpoints": { "cp1": {questions:[...], generatedAt}, ... }, "done": bool }
alter table public.discovery_sessions
  add column if not exists interview jsonb not null default '{}'::jsonb;

alter table public.tools
  add column if not exists how_to text,
  add column if not exists phases text[] not null default '{}',
  add column if not exists formats text[] not null default '{}',
  add column if not exists last_verified date;
create unique index if not exists tools_name_uidx on public.tools (name);
