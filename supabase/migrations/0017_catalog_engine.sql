-- 0017_catalog_engine: Marketplace product engine + generalized entitlements.
-- Product → Modules → Lessons → Resources (prompts/templates/tools/…) → Progress.
-- Outline (titles/summaries) is public for non-draft products. Lesson BODIES and
-- resource CONTENT live in tables with NO select policy: only the service role
-- (edge function `product-access`, after an entitlement check) can read them.

-- 1. Catalog ---------------------------------------------------------------
create table if not exists public.catalog_products (
  key              text primary key check (key ~ '^[a-z0-9-]{2,40}$'),
  kind             text not null default 'system' check (kind in ('system','service')),
  title            text not null check (length(title) <= 120),
  tagline          text check (length(tagline) <= 200),
  description      text check (length(description) <= 4000),
  category         text check (length(category) <= 60),
  status           text not null default 'draft'
                   check (status in ('draft','coming_soon','live','retired')),
  price_cents      integer check (price_cents is null or price_cents >= 0),
  list_price_cents integer check (list_price_cents is null or list_price_cents >= 0),
  currency         text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  whop_product_id  text unique,
  whop_plan_id     text,
  who_for          text[] not null default '{}',
  outcomes         text[] not null default '{}',
  includes         text[] not null default '{}',
  sort             integer not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.catalog_modules (
  id          uuid primary key default gen_random_uuid(),
  product_key text not null references public.catalog_products(key) on delete cascade,
  position    integer not null,
  title       text not null check (length(title) <= 160),
  summary     text check (length(summary) <= 1000),
  status      text not null default 'draft' check (status in ('draft','published')),
  unique (product_key, position)
);

create table if not exists public.catalog_lessons (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.catalog_modules(id) on delete cascade,
  position    integer not null,
  title       text not null check (length(title) <= 160),
  summary     text check (length(summary) <= 1000),
  est_minutes integer check (est_minutes is null or est_minutes between 1 and 600),
  is_preview  boolean not null default false,   -- free sample lesson (conversion)
  status      text not null default 'draft' check (status in ('draft','published')),
  unique (module_id, position)
);

-- PRIVATE: lesson body in the master-pack §12 lesson format (jsonb sections).
create table if not exists public.catalog_lesson_content (
  lesson_id  uuid primary key references public.catalog_lessons(id) on delete cascade,
  body       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- PRIVATE: prompts, templates, tools, checklists, worksheets, trackers, quizzes.
create table if not exists public.catalog_resources (
  id          uuid primary key default gen_random_uuid(),
  product_key text not null references public.catalog_products(key) on delete cascade,
  module_id   uuid references public.catalog_modules(id) on delete cascade,
  lesson_id   uuid references public.catalog_lessons(id) on delete cascade,
  kind        text not null check (kind in ('prompt','template','tool','checklist','worksheet','tracker','quiz','resource')),
  title       text not null check (length(title) <= 160),
  content     jsonb not null default '{}'::jsonb,
  position    integer not null default 0,
  status      text not null default 'draft' check (status in ('draft','published'))
);
create index if not exists catalog_resources_scope_idx on public.catalog_resources (product_key, module_id, lesson_id);

create table if not exists public.user_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    uuid not null references public.catalog_lessons(id) on delete cascade,
  status       text not null check (status in ('started','completed')),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

-- 2. RLS -------------------------------------------------------------------
alter table public.catalog_products       enable row level security;
alter table public.catalog_modules        enable row level security;
alter table public.catalog_lessons        enable row level security;
alter table public.catalog_lesson_content enable row level security;
alter table public.catalog_resources      enable row level security;
alter table public.user_progress          enable row level security;

create policy catalog_products_public on public.catalog_products
  for select to anon, authenticated using (status <> 'draft');
create policy catalog_modules_public on public.catalog_modules
  for select to anon, authenticated using (
    status = 'published' and exists (select 1 from public.catalog_products p
      where p.key = product_key and p.status <> 'draft'));
create policy catalog_lessons_public on public.catalog_lessons
  for select to anon, authenticated using (
    status = 'published' and exists (select 1 from public.catalog_modules m
      join public.catalog_products p on p.key = m.product_key
      where m.id = module_id and m.status = 'published' and p.status <> 'draft'));
-- catalog_lesson_content / catalog_resources: intentionally NO policies.
create policy user_progress_select_own on public.user_progress
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.catalog_products, public.catalog_modules, public.catalog_lessons to anon, authenticated;
revoke all on public.catalog_lesson_content, public.catalog_resources from anon, authenticated;
grant select on public.user_progress to authenticated;

-- 3. Purchases: any catalog product, not just 'builder' ---------------------
insert into public.catalog_products (key, kind, title, tagline, status, price_cents, currency, whop_product_id, sort)
values ('builder','service','369 Product Builder',
        'Step-by-step guided build of the product from your Blueprint.',
        'live', 4700, 'USD', 'prod_UywgvuejgK9Nx', 900)
on conflict (key) do nothing;

alter table public.purchases drop constraint if exists purchases_product_key_check;
alter table public.purchases
  add constraint purchases_product_key_fkey foreign key (product_key)
  references public.catalog_products(key) on update cascade;

-- 4. Entitlement helper (server + future RLS use) ---------------------------
create or replace function public.has_entitlement(p_uid uuid, p_product_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.purchases
                 where user_id = p_uid and product_key = p_product_key and status = 'paid');
$$;
revoke all on function public.has_entitlement(uuid, text) from public, anon, authenticated;

-- 5. Seed the five marketplace systems (honest status: none has customer-ready
--    content yet, so all are coming_soon; flip to 'live' only when content +
--    Whop product exist). Prices only where the owner has set them.
insert into public.catalog_products (key, title, tagline, category, status, price_cents, list_price_cents, sort, includes)
values
 ('digital-marketing-os', '369 Digital Marketing OS',
  'An evidence-based operating system for marketing a digital product: strategy, platforms, content, funnels and measurement.',
  'Marketing', 'coming_soon', 19700, 24700, 10,
  array['15 modules','Guided lessons','AI prompt lab','Templates & checklists','Progress tracking']),
 ('launch-system', '369 Digital Product Launch System',
  'A structured system for taking a digital product from idea to launch.',
  'Launch', 'coming_soon', null, null, 20, '{}'),
 ('content-toolkit', '369 Marketing & Content Toolkit',
  'Ready-to-use prompts, templates and workflows for marketing content.',
  'Content', 'coming_soon', null, null, 30, '{}'),
 ('adhd-system', 'ADHD Productivity System',
  'A practical system for planning, focus and follow-through.',
  'Productivity', 'coming_soon', null, null, 40, '{}'),
 ('budgeting-system', '2026 Budgeting System',
  'A guided system for building and running your 2026 budget.',
  'Personal finance', 'coming_soon', null, null, 50, '{}')
on conflict (key) do nothing;
