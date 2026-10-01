-- 0016_marketplace_leads (applied live 2026-09; committed retroactively)
-- Lead capture (name, email, phone in E.164, separate opt-in marketing consent — POPIA).
-- Insert-only for the public; no select policy.
create table if not exists public.marketplace_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null, email text not null, phone_e164 text not null,
  marketing_consent boolean not null default false, consent_text text, source text, utm jsonb,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ml_name_len check (length(btrim(full_name)) between 2 and 120),
  constraint ml_email_format check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint ml_phone_e164 check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  constraint ml_consent_text_len check (consent_text is null or length(consent_text) <= 500),
  constraint ml_source_len check (source is null or length(source) <= 60)
);
create unique index if not exists marketplace_leads_email_uidx on public.marketplace_leads (lower(email));
alter table public.marketplace_leads enable row level security;
create policy marketplace_leads_public_insert on public.marketplace_leads for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
