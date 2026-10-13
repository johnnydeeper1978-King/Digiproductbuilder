# 369 Degrees — Production Deployment

This wires the existing **Discovery → Blueprint → $97 access → Builder** journey to
live services. No app features change here. Nothing fake: every function returns an
honest error until its config exists.

Two runtimes:
- **Client** (Vite/React) → deploy to Netlify. Only `VITE_` values (all public).
- **Server** (Supabase Edge Functions) → hold all secrets via `supabase secrets`.

Supabase **auto-injects** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
into Edge Functions — you never set those.

---

## 0. Prerequisites (once)
```bash
npm i -g supabase          # or: brew install supabase/tap/supabase
supabase login             # opens a browser
npm install                # project deps
```

## 1. Supabase — schema, RLS, auth
```bash
export PROJECT_REF=<your-project-ref>      # Dashboard ▸ Project Settings ▸ General ▸ Reference ID
supabase link --project-ref "$PROJECT_REF"
supabase db push                           # applies migrations 0001–0010 in order
supabase db execute --file supabase/seed/tools.sql   # real tools, NO affiliate URLs
```
Auth: Dashboard ▸ Authentication ▸ Providers ▸ enable **Email**. (Email/password is what the app uses.)

Verify locally first (no project needed):
```bash
npm run verify     # tsc + build + schema/route/logic tests + secret scan
npm run test:db    # ephemeral Postgres: RLS, 3-product limit, entitlement, write-guards
```

## 2. Edge Functions
```bash
supabase functions deploy discovery discovery-analyze blueprint-generate builder whop-webhook
```

## 3. AI provider (server-side)
Get a key at console.anthropic.com ▸ API Keys (or OpenAI/Perplexity), then:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...     # resolver order: anthropic > openai > perplexity
```

## 4. Whop
Checkout is a hosted Whop link, not a server-created session — set it once per product:
1. whop.com dashboard ▸ create the product/plan (Builder, $97 one-time) → copy its **hosted checkout link**
   and its **plan ID**.
2. Set `VITE_WHOP_BUILDER_URL` in Netlify env to that checkout link (see `.env.example`).
3. Settings ▸ **Webhooks** ▸ add endpoint:
   - URL: `https://<PROJECT_REF>.supabase.co/functions/v1/whop-webhook`
   - Events: `payment.succeeded` (and/or `membership.went_valid` — confirm current event names in the
     Whop dashboard before relying on either, they're **VERIFY BEFORE PUBLISHING**)
   - Copy the webhook's **signing secret**.
```bash
supabase secrets set WHOP_WEBHOOK_SECRET=...
supabase secrets set WHOP_BUILDER_PLAN_ID=...
supabase secrets set APP_URL=https://<your-netlify-site>
```
Webhook is authoritative: it matches the buyer's checkout email to a Supabase auth user and only then
flips `purchases.status='paid'` (idempotent upsert on `user_id,product_key`). The browser never grants
access. **The buyer must check out with the same email they sign in to the app with** — the Paywall
copy says this; if a customer pays with a different email, reconcile manually (look up the Whop
receipt, update the `purchases` row for their actual account).

## 5. Client (Netlify)
Set env vars (Site settings ▸ Environment): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
(Dashboard ▸ Project Settings ▸ API), `VITE_APP_URL` (your site URL), `VITE_WHOP_BUILDER_URL`,
`VITE_WHOP_DMOS_URL` (once that product exists). Build `npm run build`, publish `dist`.

## 6. First production test
1. Visit `/discover` → complete the flow → `/discover/results` shows real opportunities.
2. "Choose this" → `/blueprint` renders a schema-valid blueprint (real AI).
3. `/builder` shows the paywall → pay through the Whop link with the same email as your test account.
4. Webhook fires → return to `/builder` → access granted → generate a phase → leave and return → state resumed.
5. Direct path: `/get-started` → pay → `/builder` works with no Discovery.

## Expected honest errors (not bugs)
| Condition | Result |
|---|---|
| No AI key | `501 ai_not_configured` |
| AI request fails | `502 ai_unavailable`, `ai_runs` row `failed` |
| Invalid AI output | `422 *_invalid`, `ai_runs` `invalid` |
| Whop webhook not configured | `501 not_configured` |
| Buyer email doesn't match an account | webhook returns `unmatched: true`, logged to `events`, no access granted — reconcile manually |
| Duplicate webhook delivery | idempotent upsert, no double grant |
| Unauthorized product | `403 forbidden` / RLS returns nothing |
| Client writes builder_state | DB `permission denied` (server-only columns) |

## Security
`npm run secret-scan` must pass. Secrets live only in `supabase secrets` / Netlify env.
Never commit `.env`. Service-role key is never in the client.
