-- 0019_product_system: interactive resources, module outcomes, content seeder,
-- and launch details for Products 4 (ADHD Productivity System) and 5 (2026 Budgeting System).
-- Content itself is loaded with scripts/seed-products.py (see supabase/seed/products/).
alter table public.catalog_modules add column if not exists outcome text check (length(outcome) <= 300);
alter table public.catalog_resources add column if not exists key text;
create unique index if not exists catalog_resources_key_uidx on public.catalog_resources (key) where key is not null;

-- A customer's saved answers for one interactive resource (worksheet/tracker/builder).
-- PRIVATE: no RLS policies; read/written only by `product-access` after an entitlement check.
create table if not exists public.user_resource_entries (
  user_id     uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.catalog_resources(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 200000),
  updated_at  timestamptz not null default now(),
  primary key (user_id, resource_id)
);
alter table public.user_resource_entries enable row level security;
revoke all on public.user_resource_entries from anon, authenticated;

-- Seeder: upsert one product's modules/lessons/content/resources from a JSON doc
-- in the 369 content format. Idempotent. Service role only.
create or replace function public.seed_product_content(p_product text, doc jsonb, p_preview_first boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  m jsonb; l jsonb; r jsonb;
  v_module uuid; v_lesson uuid; v_mod_res uuid;
  n_m int := 0; n_l int := 0; n_r int := 0;
begin
  for m in select * from jsonb_array_elements(coalesce(doc->'modules','[]'::jsonb)) loop
    insert into catalog_modules(product_key, position, title, summary, outcome, status)
    values (p_product, (m->>'position')::int, m->>'title', m->>'summary', m->>'outcome', 'published')
    on conflict (product_key, position) do update
      set title = excluded.title, summary = excluded.summary, outcome = excluded.outcome, status = 'published'
    returning id into v_module;
    n_m := n_m + 1;
    for l in select * from jsonb_array_elements(coalesce(m->'lessons','[]'::jsonb)) loop
      insert into catalog_lessons(module_id, position, title, summary, est_minutes, is_preview, status)
      values (v_module, (l->>'position')::int, l->>'title', l->>'summary', (l->>'est_minutes')::int,
              p_preview_first and (m->>'position')::int = 1 and (l->>'position')::int = 1, 'published')
      on conflict (module_id, position) do update
        set title = excluded.title, summary = excluded.summary, est_minutes = excluded.est_minutes,
            is_preview = excluded.is_preview, status = 'published'
      returning id into v_lesson;
      insert into catalog_lesson_content(lesson_id, body, updated_at)
      values (v_lesson, jsonb_build_object('sections', l->'sections'), now())
      on conflict (lesson_id) do update set body = excluded.body, updated_at = now();
      n_l := n_l + 1;
    end loop;
  end loop;
  for r in select * from jsonb_array_elements(coalesce(doc->'resources','[]'::jsonb)) loop
    select id into v_mod_res from catalog_modules where product_key = p_product and position = (r->>'module')::int;
    insert into catalog_resources(product_key, module_id, lesson_id, kind, title, content, position, status, key)
    values (p_product, v_mod_res, null,
            case r->>'kind' when 'worksheet' then 'worksheet' when 'template' then 'template'
                            when 'tracker' then 'tracker' when 'checklist' then 'checklist' else 'tool' end,
            r->>'title', r->'content', coalesce((r->>'module')::int, 0), 'published', r->>'key')
    on conflict (key) where key is not null do update
      set title = excluded.title, content = excluded.content, kind = excluded.kind,
          module_id = excluded.module_id, position = excluded.position, status = 'published';
    n_r := n_r + 1;
  end loop;
  return jsonb_build_object('modules', n_m, 'lessons', n_l, 'resources', n_r);
end $$;
revoke all on function public.seed_product_content(text, jsonb, boolean) from public, anon, authenticated;

-- Launch details ($19 each, from the product specs). Not purchasable until a
-- Whop product id is linked: update catalog_products set whop_product_id = 'prod_…' where key = '…';
update public.catalog_products set
  title = '369 ADHD Productivity System',
  tagline = 'Build a productivity system that makes the next action obvious — capture, prioritise, start, focus, plan and reset.',
  description = 'A practical, low-friction productivity system for adults who struggle with overwhelm, starting tasks, staying focused or keeping a plan going — including people who experience ADHD-style challenges. Work through 12 short modules and finish with your own Personal Productivity OS. This is a productivity and organisation product, not medical treatment, diagnosis or therapy.',
  category = 'Productivity', status = 'live', price_cents = 1900, list_price_cents = null,
  who_for = array['You have too many tasks and ideas competing for attention','Big tasks are hard to start, and plans quickly feel overwhelming','A missed day makes your whole system feel broken','You want a simple system you can return to when life gets messy'],
  outcomes = array['One trusted place to capture everything','Clear weekly priorities','Tasks turned into concrete next actions','A repeatable Start Now ritual','Flexible focus, scheduling and energy planning','A weekly reset that restores clarity','Your own Personal Productivity OS'],
  includes = array['12 modules · 39 guided lessons','20 interactive worksheets, planners and trackers','Learn → See it → Try it → Use it → Test yourself','7-Day Quick Start','Progress tracking','Your Personal Productivity OS builder'],
  updated_at = now()
where key = 'adhd-system';

update public.catalog_products set
  title = '2026 Budgeting System',
  tagline = 'Build a clear 2026 money system: what comes in, what goes out, what to save, what to pay and what to review next.',
  description = 'A guided budgeting and financial-organisation system. Work through 12 modules — income, fixed and variable expenses, debt, savings, emergency fund, sinking funds, a monthly budget, weekly check-ins and an annual plan — and finish with your own 2026 Money OS. General budgeting education only: not individual investment, tax, legal, credit or financial-planning advice.',
  category = 'Personal finance', status = 'live', price_cents = 1900, list_price_cents = null,
  who_for = array['Money seems to disappear without a clear picture','Bills are scattered and irregular expenses catch you by surprise','Savings are inconsistent and debt is hard to track','You want a simple, repeatable way to stay on top of your money in 2026'],
  outcomes = array['Your income made visible and planned','Fixed and variable expenses organised','A debt dashboard you can track','Savings goals with real targets','Sinking funds for irregular expenses','A monthly budget and weekly check-in','Your own 2026 Money OS'],
  includes = array['12 modules · 37 guided lessons','20 interactive trackers, planners and calculators','Spreadsheet-ready tables with CSV export','7-Day Money Reset','Progress tracking','Your 2026 Money OS builder'],
  updated_at = now()
where key = 'budgeting-system';
