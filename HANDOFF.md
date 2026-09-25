# HANDOFF — Phase A (AI activation + Whop payments)

Written by Claude (web) on 2026-09-24 for Claude Code on Desktop.
Supabase project: `unsdlslapjpzyjoghhen` (eu-west-2).

## 1. Commit these files first

Everything in this bundle is ALREADY DEPLOYED to Supabase and is newer than
GitHub. Copy it over the repo (same paths) and commit before any deploy from
the repo, or the live fixes get overwritten.

```
schemas/*.json                                   (unchanged, included for completeness)
supabase/migrations/0011_ai_usage.sql            (applied)
supabase/migrations/0012_whop.sql                (applied)
supabase/migrations/0013_pg_net.sql              (applied)
supabase/functions/_shared/ai/anthropic.ts       NEW  real adapter
supabase/functions/_shared/ai/limits.ts          NEW  cost/abuse guards
supabase/functions/_shared/ai/provider.ts        CHANGED  maxTokens, usage, cost
supabase/functions/_shared/ai/index.ts           comment only
supabase/functions/_shared/schema/validate.ts    CHANGED  exports schema bundles for prompts
supabase/functions/_shared/entitlements.ts       CHANGED  limit(1) + confirmed-email claim
supabase/functions/_shared/whop.ts               NEW
supabase/functions/discovery-analyze/index.ts    CHANGED
supabase/functions/blueprint-generate/index.ts   CHANGED
supabase/functions/builder/index.ts              CHANGED
supabase/functions/whop-checkout/index.ts        NEW
supabase/functions/whop-webhook/index.ts         NEW  (deploy with --no-verify-jwt)
tests/pure_test.ts                               NEW  `deno test tests/pure_test.ts`
```

Deploy settings: every function keeps `verify_jwt = true` EXCEPT `whop-webhook`
(`verify_jwt = false`; it authenticates by Whop signature). Add to
`supabase/config.toml`:

```toml
[functions.whop-webhook]
verify_jwt = false
```

`stripe-checkout` / `stripe-webhook` are still deployed but inert (no Stripe
secrets). Leave them; remove later.

## 2. What the backend does now

| Function | Auth | Behaviour |
|---|---|---|
| `discovery` | anon token | unchanged. `select` takes `{ action:"select", anonToken, opportunity_ref }` |
| `discovery-analyze` | anon token or JWT | Haiku 4.5, 8k max tokens. Returns `{ output }`; repeat calls return `{ output, cached:true }` for free. Opportunities get refs `opp-1..3`, `unexp-1..3` |
| `blueprint-generate` | anon token or JWT | needs a selected opportunity. One per session; repeats return cached |
| `builder` | JWT + paid | unchanged API. `generate` capped 20/user/day, 4k tokens |
| `whop-checkout` | JWT | POST `{ appUrl? }` → `{ url }` (redirect the browser there) or `{ alreadyOwned:true }` |
| `whop-webhook` | Whop signature | `payment.succeeded` → purchase `paid`; `dispute.created` → `disputed` |

Error codes the UI must handle (show a friendly message, never a raw error):
`ai_daily_cap_reached` (429), `in_progress` (409), `too_many_attempts` (429),
`builder_daily_cap_reached` (429), `builder_access_required` (403),
`ai_unavailable` (502), `ai_output_invalid` / `blueprint_invalid` (422),
`payments_not_configured` (501), `checkout_unavailable` (502).

Guards: global cap `AI_DAILY_RUN_CAP` (default 40 AI calls / 24h),
`AI_BUILDER_DAILY_CAP` (default 20). Every call is logged in `ai_runs` with
tokens and `est_cost_usd`. Spend so far: `select sum(est_cost_usd) from ai_runs;`

## 3. Secrets (Supabase → Edge Functions → Secrets; never in the frontend)

| Name | Status 2026-09-24 |
|---|---|
| `ANTHROPIC_API_KEY` | set, working (workspace-scoped key) |
| `ANTHROPIC_MODEL` | optional; default `claude-haiku-4-5-20251001` |
| `ANTHROPIC_WORKSPACE_ID` | only if using a non-workspace key |
| `WHOP_API_KEY` | not verified yet — needs a signed-in test |
| `WHOP_WEBHOOK_SECRET` | NOT SET (webhook returns 501) |
| `APP_URL` | recommended, e.g. `https://<your-domain>` — checkout redirect target |
| `WHOP_COMPANY_ID`, `WHOP_BUILDER_PRODUCT_ID`, `WHOP_BUILDER_PLAN_ID` | optional overrides; defaults `biz_5LxzQhYQsk1Wbw`, `prod_UywgvuejgK9Nx`, plan auto-resolved |

## 4. Frontend tasks (Phase C)

1. Paywall "Buy the Builder" → `supabase.functions.invoke("whop-checkout", { body: { appUrl: location.origin } })` → `location.href = data.url`. Signed-in users only; send anonymous users to sign-up first.
2. `/builder?checkout=success`: poll `builder` `{action:"list"}` every 3s for up to 60s until it stops returning 403 (the webhook may land a few seconds after redirect).
3. Discovery screens: verify the flow is `start → answer×N → discovery-analyze → discovery select (opportunity_ref) → blueprint-generate`, with loading states (analyze ≈ 60s, blueprint ≈ 40s) and the error codes above.
4. Double-click protection on every AI button (server also guards, but avoid 409s).
5. Remove any hard-coded Whop links from the paywall, or keep one only as a fallback. Link buyers are matched by email and claim access on sign-in **only if their email is confirmed** → keep Supabase Auth email confirmation ON.
6. AI Workforce: show a waitlist, no checkout.
7. `npm run typecheck && npm run build`, then one real purchase end to end.

## 5. Verified live (2026-09-24)

- Discovery analyze → 6 opportunities, $0.023. Select → OK. Blueprint → valid, $0.017.
- Repeat calls → cached, 0 new AI runs.
- Forged webhook → rejected. Anonymous checkout → 401.
- Test session (safe to delete): `discovery_sessions.id = d3c36a91-13e7-40f7-8536-fd72357d406a`, `metadata.test = true`.

## 6. Not yet verified

- Whop webhook with a real signature (needs `WHOP_WEBHOOK_SECRET`, then "Send test event" in Whop).
- `whop-checkout` plan lookup + checkout creation (needs a signed-in user).
- Builder `generate` live (needs a paid user).

---

# UPDATE — Discovery interview, Product Guide, Builder teacher (2026-09-25)

Sources honoured: discovery-flow.md (steps 1–11 + "never a static questionnaire"),
369_DEGREES___MASTER_BUILD_INSTRUCTIONS ($47 Builder section), CLAUDE-1.md (Builder/AI Guide),
tools.sql (no invented affiliate links).

## Deployed
- `discovery-interview` (NEW, v2) — structured interview + AI checkpoints.
- Migration `0014_discovery_interview.sql` — applied.

## Written, NOT yet deployed (next session)
- `discovery-analyze` — readable transcript (labels, "[in their own words]"), requires finished interview.
- `blueprint-generate` — Product Guide prompt + extended schema (summary, creation, marketingPlan,
  firstCustomers, builderPreview). max_tokens 8000.
- `builder` — teacher output schema (why, decisions, steps{where,how,prompt,outcome}, prompts, tools,
  checklist, mayChange, nextAction); catalogue-only tools; max_tokens 6000.
- `supabase/seed/tools_v2.sql` — APPLIED (22 tools live, all with phases + how_to).

## Discovery interview contract (frontend)
POST discovery-interview `{ action:"next", anonToken }` or `{ action:"answer", anonToken, key, answer }`
→ `{ step:{ kind:"question", question:{ key, section, sectionTitle, sectionIntro, text, why, type:"single"|"multi"|"text",
     options:[{value,label}], allowOther, required, source:"bank"|"ai_followup", previous } }, progress:{answered,total,percent} }`
→ or `{ step:{ kind:"done" } }` → then call discovery-analyze.
Answer shapes: single `{choice:"value", other?:"..."}`, multi `{choice:["v1","v2"], other?}`, text `{text:"..."}`.
`allowOther` → show an "In your own words" field (→ `other`). Optional questions may be skipped with `answer:{}`.
AI follow-ups (source:"ai_followup") appear after sections 2 and 4 — label them "A few follow-up questions".
The call that triggers a checkpoint takes ~10–20s: show "Reviewing your answers…".
Errors: unknown_option, single_choice_only, choice_required, text_required, answer_too_long, unknown_question,
interview_complete (409), in_progress (409).

## Free guide
Guide (Blueprint) shows in full; "Download PDF" requires a free account (lead capture). Render the PDF
client-side from the blueprint JSON. Show `builderPreview` next to the $47 CTA.

## Cost control
AI_DAILY_BUDGET_USD (default 1.00) replaces the old 40-calls/day cap; AI_DAILY_RUN_CAP (300) is a backstop.

## Guide: other profitable opportunities (2026-09-25)
`blueprint-generate` passes the session's non-selected opportunities to the model; the guide gains
`alternativeOpportunities` (2–3: name, targetBuyer, format, whyItCouldPay, priceHypothesis, fitForYou).
Show them after the main guide under "Other opportunities worth considering". No extra AI call.

## Deploy from the repo (do this once the bundle is committed)
```
supabase link --project-ref unsdlslapjpzyjoghhen
supabase functions deploy discovery-analyze
supabase functions deploy blueprint-generate
supabase functions deploy builder
supabase functions deploy discovery-interview
supabase functions deploy whop-checkout
supabase functions deploy whop-webhook --no-verify-jwt
```
Then run `deno test tests/` and ask Claude (web) to run the live journey test.
