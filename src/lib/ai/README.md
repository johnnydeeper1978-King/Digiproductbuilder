# AI boundary

- `src/lib/ai/types.ts` — provider-agnostic contract (types only, no keys).
- `src/services/aiService.ts` — the single client entry point; POSTs to the
  server. Throws `NotImplementedError` until wired (no fake responses).
- `supabase/functions/ai/` + `supabase/functions/_shared/ai/` — server-side
  providers (OpenAI / Anthropic / Perplexity). Keys live here via `Deno.env`.

Rule: the browser never calls a model provider directly and never holds a key.
