-- 0006_rls.sql
-- Row Level Security. Users may access ONLY their own user-scoped data.
-- No public/anon policies: anonymous Discovery rows (user_id null) are handled
-- server-side via the service role, which bypasses RLS. Child tables are
-- scoped through their parent discovery_session's ownership.

alter table public.profiles           enable row level security;
alter table public.discovery_sessions enable row level security;
alter table public.discovery_answers  enable row level security;
alter table public.opportunities      enable row level security;
alter table public.blueprints         enable row level security;
alter table public.products           enable row level security;
alter table public.ai_runs            enable row level security;
alter table public.events             enable row level security;

-- ---- profiles ------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---- discovery_sessions --------------------------------------------------
create policy "sessions_select_own" on public.discovery_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "sessions_insert_own" on public.discovery_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "sessions_update_own" on public.discovery_sessions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "sessions_delete_own" on public.discovery_sessions
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---- discovery_answers (scoped via session ownership) --------------------
create policy "answers_select_own" on public.discovery_answers
  for select to authenticated using (exists (
    select 1 from public.discovery_sessions s
    where s.id = discovery_answers.session_id and s.user_id = (select auth.uid())));
create policy "answers_insert_own" on public.discovery_answers
  for insert to authenticated with check (exists (
    select 1 from public.discovery_sessions s
    where s.id = discovery_answers.session_id and s.user_id = (select auth.uid())));
create policy "answers_delete_own" on public.discovery_answers
  for delete to authenticated using (exists (
    select 1 from public.discovery_sessions s
    where s.id = discovery_answers.session_id and s.user_id = (select auth.uid())));

-- ---- opportunities (scoped via session ownership) ------------------------
create policy "opportunities_select_own" on public.opportunities
  for select to authenticated using (exists (
    select 1 from public.discovery_sessions s
    where s.id = opportunities.session_id and s.user_id = (select auth.uid())));
create policy "opportunities_insert_own" on public.opportunities
  for insert to authenticated with check (exists (
    select 1 from public.discovery_sessions s
    where s.id = opportunities.session_id and s.user_id = (select auth.uid())));
create policy "opportunities_update_own" on public.opportunities
  for update to authenticated using (exists (
    select 1 from public.discovery_sessions s
    where s.id = opportunities.session_id and s.user_id = (select auth.uid())));

-- ---- blueprints ----------------------------------------------------------
create policy "blueprints_select_own" on public.blueprints
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.discovery_sessions s
               where s.id = blueprints.session_id and s.user_id = (select auth.uid())));
create policy "blueprints_insert_own" on public.blueprints
  for insert to authenticated with check (
    user_id = (select auth.uid())
    or exists (select 1 from public.discovery_sessions s
               where s.id = blueprints.session_id and s.user_id = (select auth.uid())));
create policy "blueprints_update_own" on public.blueprints
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---- products ------------------------------------------------------------
create policy "products_select_own" on public.products
  for select to authenticated using (user_id = (select auth.uid()));
create policy "products_insert_own" on public.products
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "products_update_own" on public.products
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "products_delete_own" on public.products
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---- ai_runs (read-only to owner; writes are server-side) ----------------
create policy "ai_runs_select_own" on public.ai_runs
  for select to authenticated using (user_id = (select auth.uid()));

-- ---- events (read-only to owner; writes are server-side) -----------------
create policy "events_select_own" on public.events
  for select to authenticated using (user_id = (select auth.uid()));
