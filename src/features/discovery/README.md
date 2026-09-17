# Discovery feature (not implemented in the foundation)

Owns the guided question flow, answer capture, user-profile assembly,
opportunity generation/scoring, unexpected opportunities and blueprint
generation. All AI runs go through `@/services/aiService` → the server-side
`ai` edge function. Structured outputs validate against `schemas/`.
Do not build the scorer until `docs/SCORING_RECONCILIATION.md` is resolved.
