-- 0001_init.sql
-- Extensions + shared helper functions/triggers.
-- Source of truth: project spec + the four JSON schemas. No business logic,
-- no scoring, no Discovery AI here.

create extension if not exists pgcrypto;      -- gen_random_uuid()

-- Generic updated_at maintenance.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-provision a public.profiles row when an auth user is created.
-- SECURITY DEFINER so it can write regardless of the caller's RLS context.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;
