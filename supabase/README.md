# Supabase

## Migrations (apply in order)

| File | Contents |
|---|---|
| `0001_init.sql` | `pgcrypto`; `set_updated_at()`; `handle_new_user()` |
| `0002_profiles.sql` | `profiles` (+ new-user + updated_at triggers) |
| `0003_discovery.sql` | `discovery_sessions`, `discovery_answers`, `opportunities`, `blueprints` |
| `0004_products.sql` | `products` + concurrency-safe 3-product limit |
| `0005_ai_runs_events.sql` | `ai_runs`, `events` |
| `0006_rls.sql` | RLS + policies for all base tables |
| `0007_discovery_answer_unique.sql` | unique `(session_id, question_key)` for answer upsert |
| `0008_products_links.sql` | `products.opportunity_id`; one-product-per-discovery-session |
| `0009_purchases.sql` | `purchases` (authoritative entitlement) + RLS + `has_builder_access()` |
| `0010_builder.sql` | `ai_runs.product_id`; `tools` catalogue; server-only write of Builder columns |

## Apply (requires an authenticated Supabase project — NOT done in this repo)

```bash
supabase link --project-ref <your-ref>   # you run this
supabase db push
supabase functions deploy discovery discovery-analyze blueprint-generate stripe-checkout stripe-webhook builder
```

> Validated locally against ephemeral PostgreSQL with a stubbed `auth` schema
> (tables, FKs, indexes, RLS, 3-product limit, entitlement function, selection,
> blueprint persistence, product association, duplicate-prevention all verified).
> NOT pushed to any remote project from here.

## Edge functions

| Function | Role |
|---|---|
| `discovery` | anon session/answer/select/claim (service role, scoped by `anon_token`) |
| `discovery-analyze` | Discovery AI boundary → validated `discovery-output` |
| `blueprint-generate` | Blueprint AI boundary → validated `blueprint`, persists + associates product |
| `stripe-checkout` | creates a PENDING purchase + Stripe Checkout Session (auth required) |
| `stripe-webhook` | **authoritative** payment confirmation → flips purchase to `paid` |
| `builder` | entitlement-gated Builder boundary → guided phases, persists `builder_state` |

## Required secrets (server-side only; set via `supabase secrets set`)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- One AI provider: `ANTHROPIC_API_KEY` | `OPENAI_API_KEY` | `PERPLEXITY_API_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_BUILDER_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`

Until these exist, the corresponding functions return honest configuration
errors (501) — never fake AI output or fabricated payment success.
