-- 0011_whop_dmos.sql
-- Moves purchases off Stripe-specific columns onto a provider-agnostic shape
-- (Whop is the live payment provider) and adds the Digital Marketing OS
-- product. The Whop webhook (service role) is the ONLY writer of a 'paid'
-- status, same contract as before.

alter table public.purchases drop constraint if exists purchases_product_key_check;
alter table public.purchases add constraint purchases_product_key_check
  check (product_key in ('builder', 'digital-marketing-os'));

alter table public.purchases alter column provider set default 'whop';

alter table public.purchases rename column stripe_checkout_session_id to whop_membership_id;
alter table public.purchases rename column stripe_payment_intent_id to whop_receipt_id;
-- stripe_checkout_session_id carried a uniqueness constraint; keep that
-- behaviour on whop_membership_id (Whop membership ids are unique per sale).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'purchases_whop_membership_id_key'
  ) then
    alter table public.purchases add constraint purchases_whop_membership_id_key unique (whop_membership_id);
  end if;
end $$;

create or replace function public.has_builder_access(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.purchases
    where user_id = uid and product_key = 'builder' and status = 'paid'
  );
$$;

create or replace function public.has_digital_marketing_os_access(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.purchases
    where user_id = uid and product_key = 'digital-marketing-os' and status = 'paid'
  );
$$;
