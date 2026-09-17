# 369 Degrees

Discover a digital product opportunity, turn it into a blueprint, and build and
sell it. This repository is the **application foundation** — a clean, typed,
production-oriented base for the Discovery → Blueprint → $47 Builder journey.

> Foundation scope only. Discovery AI, live payments, Marketplace and AI
> Workforce are **boundaried placeholders**, not fake implementations.

## Stack

Vite · React 18 · TypeScript · React Router 6 · Supabase (client + edge
functions) · provider-agnostic AI boundary.

## Install & run

```bash
npm install
cp .env.example .env    # fill in the VITE_ values
npm run dev             # http://localhost:5173
npm run typecheck       # tsc --noEmit
npm run build           # typecheck + production build
```

The app runs without env configured — auth-gated routes and the login form
show honest "not configured" states instead of faking a session.

## Environment variables

Client-safe (compiled into the browser bundle — public only):

| Var | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_APP_URL` | App base URL (redirects) |

Server-only (NEVER `VITE_`-prefixed, never imported in `src/`; live in Supabase
Edge Functions): `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `STRIPE_SECRET_KEY`.

## Project structure

```
schemas/                 Canonical JSON Schemas (source of truth)
docs/                    SCORING_RECONCILIATION.md and other notes
supabase/functions/      Server-side edge functions (AI boundary; Deno)
src/
  config/env.ts          Client env access (VITE_ only)
  lib/supabase/          Browser client (anon key only)
  lib/ai/                Provider-agnostic AI types + boundary docs
  services/              auth / products / aiService (client entry points)
  types/schemas/         TS mirrors of the JSON Schemas
  types/                 product + user (roles) domain types
  components/ui/         Button, Card, Badge, Container
  components/feedback/   Loading / Error / Empty / Unauthorized / NotFound / ErrorBoundary
  components/layout/     Public + App shells, Navbar, Sidebar, RequireAuth
  components/seo/         Per-page title + meta
  components/common/     PlaceholderPage (honest "not built yet")
  features/              discovery / builder / marketplace / workforce (READMEs)
  pages/public/          Landing, how-it-works, discover, blueprint, builder, …
  pages/app/             Dashboard, products, ai-guide, settings, …
  styles/                tokens.css + globals.css (design system)
```

## Architecture boundaries

- **Supabase is the source of truth** for application state. The browser uses
  only the anon key; privileged work runs in edge functions.
- **AI is provider-agnostic and server-side.** The browser never holds a
  provider key and never calls a model directly — it calls `aiService`, which
  targets the `ai` edge function. OpenAI / Anthropic / Perplexity adapters are
  swappable behind one contract.
- **No fake functionality.** Unbuilt features render placeholders that state
  what/why/next and are marked unavailable. Services throw rather than fabricate.
- **Authorization is real** (Supabase session + RLS), never trusted from the
  client.

## Adding AI later (intended path)

1. Implement provider adapters in `supabase/functions/_shared/ai/*` using
   `Deno.env` keys.
2. Implement the `ai` edge function to select a provider and validate output
   against the relevant schema in `schemas/`.
3. Point `src/services/aiService.ts` at `${SUPABASE_URL}/functions/v1/ai`.
4. Keep all keys server-side; the client contract in `src/lib/ai/types.ts`
   does not change.

## Known follow-up

See **`docs/SCORING_RECONCILIATION.md`** — the opportunity `score.breakdown`
schema and `product-scoring.md` disagree and must be reconciled before the
scoring engine is built.
