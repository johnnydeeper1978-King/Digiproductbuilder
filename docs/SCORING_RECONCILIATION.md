# ⚠️ REQUIRED PRE-SCORER RECONCILIATION

**Status: OPEN — do not build the scoring engine until this is resolved.**

The repository audit found a mismatch between two sources of truth for
opportunity scoring. They must be reconciled **by the project owner** before
any scoring logic is implemented. Do not resolve this unilaterally.

## The mismatch

**`knowledge/product-scoring.md`** defines a **10-category, 100-point** model:

| Category | Max |
|---|---|
| User Fit | 15 |
| Problem Clarity | 15 |
| Audience Clarity | 10 |
| Product Specificity | 10 |
| Creation Simplicity | 10 |
| Time Fit | 10 |
| Marketing Potential | 10 |
| Business Style Fit | 5 |
| First Product Potential | 10 |
| Expansion Potential | 5 |
| **Total** | **100** |

**`schemas/opportunity.schema.json`** (`score.breakdown`) defines **7 different
keys**: `userFit`, `problemClarity`, `buyerClarity`, `feasibility`,
`differentiation`, `demandSignals`, `distributionPotential` — with
`additionalProperties: false`.

## Why it blocks the scorer

Output produced per `product-scoring.md` would be **rejected** by the schema
(different keys; strict `additionalProperties`). `overall` still validates, so
this does not block the rest of the build — only the scorer.

## Options (owner to choose ONE)

1. **Adopt product-scoring.md as canonical** → update `score.breakdown` in
   `opportunity.schema.json` (and `src/types/schemas/opportunity.ts`) to the 10
   categories + weights.
2. **Adopt the schema's 7 dimensions as canonical** → revise `product-scoring.md`
   to match.
3. **Two-layer model** → keep the 10-category framework as the scoring *method*
   and map it down to a smaller reported `breakdown`, documenting the mapping.

## Referenced from

- `src/types/schemas/opportunity.ts` (`OpportunityScoreBreakdown`)
- `schemas/opportunity.schema.json`
