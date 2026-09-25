-- 0012: Whop payments. Stripe columns are kept (not dropped) for history.
alter table public.purchases
  add column if not exists whop_payment_id text,
  add column if not exists whop_membership_id text,
  add column if not exists whop_checkout_config_id text,
  add column if not exists buyer_email text;

create unique index if not exists purchases_whop_payment_id_uidx
  on public.purchases (whop_payment_id) where whop_payment_id is not null;
create unique index if not exists purchases_whop_checkout_config_id_uidx
  on public.purchases (whop_checkout_config_id) where whop_checkout_config_id is not null;
create index if not exists purchases_unclaimed_email_idx
  on public.purchases (buyer_email) where user_id is null;

-- Buyers from a plain Whop link may not have an account yet: their purchase
-- is stored unclaimed (user_id null) and claimed on sign-in by confirmed email.
alter table public.purchases alter column user_id drop not null;
alter table public.purchases alter column provider set default 'whop';

alter table public.purchases drop constraint if exists purchases_status_check;
alter table public.purchases add constraint purchases_status_check
  check (status in ('pending', 'paid', 'failed', 'refunded', 'disputed'));

-- Webhook idempotency (server-only: RLS on, no policies).
create table if not exists public.webhook_events (
  id text primary key,
  provider text not null,
  type text,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;

-- Email -> auth user lookup for the webhook. Service role only.
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke all on function public.find_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_id_by_email(text) to service_role;
