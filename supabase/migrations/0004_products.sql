-- 0004_products.sql
-- Up to 3 (non-archived) products per user, enforced at the DB layer and safe
-- under concurrency. Future linkage columns to discovery + blueprint + builder.

create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  status               text not null default 'draft'
                       check (status in ('draft','active','archived')),
  current_phase        text not null default 'strategy'
                       check (current_phase in
                              ('strategy','customer','offer','creation','brand',
                               'landing','payment','content','launch','optimization')),
  progress             integer not null default 0
                       check (progress >= 0 and progress <= 100),
  -- Future linkage (nullable now).
  discovery_session_id uuid references public.discovery_sessions(id) on delete set null,
  blueprint_id         uuid references public.blueprints(id) on delete set null,
  builder_state        jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_products_user on public.products(user_id);
create index if not exists idx_products_user_status on public.products(user_id, status);
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- 3-product rule. A transaction-scoped advisory lock keyed on the user makes
-- the count-then-insert atomic per user, so concurrent inserts cannot both
-- pass the check. Applies to INSERT and to UPDATEs that un-archive a product.
-- "Archived" products do not count, so archiving frees a slot.
create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
as $$
declare
  active_count integer;
begin
  if new.status = 'archived' then
    return new;  -- archived rows never consume a slot
  end if;

  perform pg_advisory_xact_lock(hashtext('product_limit:' || new.user_id::text));

  select count(*) into active_count
  from public.products
  where user_id = new.user_id
    and status <> 'archived'
    and id <> new.id;

  if active_count >= 3 then
    raise exception
      'PRODUCT_LIMIT_REACHED: a user may have at most 3 non-archived products'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_product_limit on public.products;
create trigger trg_enforce_product_limit
  before insert or update of status, user_id on public.products
  for each row execute function public.enforce_product_limit();
