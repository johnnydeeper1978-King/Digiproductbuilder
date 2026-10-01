-- 0015_waitlist (applied live 2026-09; committed retroactively)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null, product_key text not null, name text, source text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_format check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint waitlist_product_key check (product_key in ('ai-workforce','digital-marketing-os','launch-system','content-toolkit','adhd-system','budgeting-system','marketplace-listing')),
  constraint waitlist_name_len check (name is null or length(name) <= 120),
  constraint waitlist_source_len check (source is null or length(source) <= 60)
);
create unique index if not exists waitlist_email_product_uidx on public.waitlist (lower(email), product_key);
alter table public.waitlist enable row level security;
create policy waitlist_public_insert on public.waitlist for insert to anon, authenticated with check (true);
grant insert on public.waitlist to anon, authenticated;
