-- 0008_products_links.sql
-- Associate a product with the selected opportunity, and prevent duplicate
-- products when a user resumes the Discovery -> Blueprint -> Builder flow.

alter table public.products
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;

create index if not exists idx_products_opportunity on public.products(opportunity_id);

-- One product per discovery session (a session belongs to a single user), so a
-- resumed flow updates the existing product instead of creating a second.
create unique index if not exists uq_products_discovery_session
  on public.products(discovery_session_id)
  where discovery_session_id is not null;
