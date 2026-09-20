# 369 Degrees — Production Deployment

This wires the existing **Discovery → Blueprint → $47 access → Builder** journey to
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
supabase functions deploy discovery discovery-analyze blueprint-generate builder stripe-checkout stripe-webhook
```

## 3. AI provider (server-side)
Get a key at console.anthropic.com ▸ API Keys (or OpenAI/Perplexity), then:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...     # resolver order: anthropic > openai > perplexity
```

## 4. Stripe
1. dashboard.stripe.com ▸ **Products** ▸ create "369 Digital Product Builder", one-time **$47** → copy the **Price ID** (`price_...`).
2. Developers ▸ **API keys** → copy the **Secret key** (`sk_...`).
3. Developers ▸ **Webhooks** ▸ Add endpoint:
   - URL: `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`).
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_BUILDER_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://<your-netlify-site>
```
Webhook is authoritative: only `checkout.session.completed` flips `purchases.status='paid'`
(idempotent via `.neq('status','paid')` + a unique paid index). The browser never grants access.

## 5. Client (Netlify)
Set env vars (Site settings ▸ Environment): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
(Dashboard ▸ Project Settings ▸ API), `VITE_APP_URL` (your site URL). Build `npm run build`,
publish `dist`.

## 6. First production test
1. Visit `/discover` → complete the flow → `/discover/results` shows real opportunities.
2. "Choose this" → `/blueprint` renders a schema-valid blueprint (real AI).
3. `/builder` shows the paywall → pay with a Stripe **test card** `4242 4242 4242 4242`.
4. Webhook fires → return to `/builder` → access granted → generate a phase → leave and return → state resumed.
5. Direct path: `/get-started` → pay → `/builder` works with no Discovery.

## Expected honest errors (not bugs)
| Condition | Result |
|---|---|
| No AI key | `501 ai_not_configured` |
| AI request fails | `502 ai_unavailable`, `ai_runs` row `failed` |
| Invalid AI output | `422 *_invalid`, `ai_runs` `invalid` |
| Stripe not configured | `501 payments_not_configured` |
| Cancelled checkout | back to `/builder?checkout=cancelled`, no access |
| Duplicate webhook | idempotent, no double grant |
| Unauthorized product | `403 forbidden` / RLS returns nothing |
| Client writes builder_state | DB `permission denied` (server-only columns) |

## Security
`npm run secret-scan` must pass. Secrets live only in `supabase secrets` / Netlify env.
Never commit `.env`. Service-role key is never in the client.
