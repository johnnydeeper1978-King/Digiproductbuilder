-- 0009_purchases.sql
-- Authoritative purchase / entitlement records. The Stripe webhook (service
-- role) is the ONLY writer of a 'paid' status. Builder access is derived from a
-- paid row here — never from a frontend redirect. No secrets are stored.

create table if not exists public.purchases (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  product_key                 text not null default 'builder'
                              check (product_key in ('builder')),
  status                      text not null default 'pending'
                              check (status in ('pending','paid','failed','refunded')),
  provider                    text not null default 'stripe',
  amount                      integer,          -- minor units (e.g. cents)
  currency                    text,
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index if not exists idx_purchases_user on public.purchases(user_id);
create index if not exists idx_purchases_lookup on public.purchases(user_id, product_key, status);
-- At most one active entitlement per product per user (idempotent webhook).
create unique index if not exists uq_purchases_paid
  on public.purchases(user_id, product_key) where status = 'paid';

create trigger trg_purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;
-- Owner may READ their own purchases; writes are server-side (service role) only.
create policy "purchases_select_own" on public.purchases
  for select to authenticated using (user_id = (select auth.uid()));

-- Server-usable entitlement check (also suitable for future Builder-table RLS).
create or replace function public.has_builder_access(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.purchases
    where user_id = uid and product_key = 'builder' and status = 'paid'
  );
$$;
