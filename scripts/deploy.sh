#!/usr/bin/env bash
# 369 Degrees — production deploy helper. Run from your machine with the Supabase
# CLI installed and logged in. This performs the REAL remote steps.
#   Install CLI:  npm i -g supabase   (or: brew install supabase/tap/supabase)
#   Login:        supabase login
set -euo pipefail
cd "$(dirname "$0")/.."

: "${PROJECT_REF:?Set PROJECT_REF to your Supabase project ref (Dashboard > Project Settings > General > Reference ID)}"

echo "==> Linking project $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "==> Applying migrations"
supabase db push

echo "==> Seeding tools catalogue (no affiliate URLs)"
supabase db execute --file supabase/seed/tools.sql || echo "  (seed skipped/failed — apply manually if needed)"

echo "==> Deploying edge functions"
supabase functions deploy discovery discovery-analyze blueprint-generate builder stripe-checkout stripe-webhook

echo "==> Secrets: set these once (values NOT stored in the repo):"
cat <<'HINT'
  supabase secrets set ANTHROPIC_API_KEY=...        # or OPENAI_API_KEY / PERPLEXITY_API_KEY
  supabase secrets set STRIPE_SECRET_KEY=sk_...
  supabase secrets set STRIPE_BUILDER_PRICE_ID=price_...
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
  supabase secrets set APP_URL=https://your-site
HINT
echo "==> Done. Register the Stripe webhook to:"
echo "    https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook   (event: checkout.session.completed)"
