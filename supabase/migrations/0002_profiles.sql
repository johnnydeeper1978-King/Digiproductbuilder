-- 0002_profiles.sql
-- Application-level profile, 1:1 with auth.users.
-- Includes user-profile.schema.json fields as the user's latest consolidated
-- profile (per-session snapshots live on discovery_sessions.user_profile).

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  -- Account role. Authorization is enforced server-side (RLS / edge fns);
  -- this column is descriptive, never trusted from the client.
  role          text not null default 'free'
                check (role in ('free','builder_customer','workforce_lead',
                                'workforce_customer','coaching_customer',
                                'affiliate','admin')),
  -- user-profile.schema.json fields (all optional / nullable).
  skills               text[],
  experience           text[],
  interests            text[],
  goals                text[],
  available_time       jsonb,
  business_preference  jsonb,
  brand_preference     text
                       check (brand_preference in
                              ('personal-brand','faceless','either','undecided')),
  discovery_pathway    text[],
  potential_niches     text[],
  customer_problems    text[],
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Fire the provisioning trigger on new auth users.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
