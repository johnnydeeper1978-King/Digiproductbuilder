-- 0010_builder.sql
-- Builder foundations: associate AI runs to a product, a reusable tool-
-- recommendation catalogue, and DB-level enforcement that Builder-managed
-- product columns can only be written server-side (service role).

-- Associate AI runs with a product (Builder runs relate to a product, not a session).
alter table public.ai_runs
  add column if not exists product_id uuid references public.products(id) on delete set null;
create index if not exists idx_ai_runs_product on public.ai_runs(product_id);

-- Reusable tool-recommendation boundary. Affiliate fields are nullable and are
-- NEVER fabricated; a recommendation without a configured link simply has none.
create table if not exists public.tools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text not null,       -- e.g. product-creation, landing-page, email, payments
  purpose           text,
  recommended_use   text,
  alternative       text,
  affiliate_url     text,                -- null unless a real relationship is configured
  is_affiliate      boolean not null default false,
  disclosure        text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_tools_category on public.tools(category) where active;
create trigger trg_tools_updated_at
  before update on public.tools
  for each row execute function public.set_updated_at();

alter table public.tools enable row level security;
-- Catalogue is readable by any authenticated user; writes are service-role/admin only.
create policy "tools_select_active" on public.tools
  for select to authenticated using (active);

-- DB-level guard: Builder-managed columns on products may only be written by the
-- service role (the Builder edge function, after verifying entitlement + ownership).
-- A column-level REVOKE cannot subtract from a table-level UPDATE grant, so we
-- remove the table-level UPDATE and re-grant UPDATE on ONLY the user-editable
-- columns (name, status). builder_state / current_phase / progress / *_id then
-- have no client UPDATE privilege at all; RLS still applies on top.
revoke update on public.products from authenticated, anon;
grant update (name, status) on public.products to authenticated;
