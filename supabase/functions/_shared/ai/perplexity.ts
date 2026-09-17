// perplexity adapter (server-side, Deno). STUB: no live calls yet, no fake output.
// Implement against the real perplexity API in the AI phase, reading the key from
// Deno.env. It must throw (not fabricate) until implemented.
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./provider.ts";

export const perplexityProvider: AIProvider = {
  name: "perplexity",
  async complete(_req: AICompletionRequest): Promise<AICompletionResponse> {
    throw new Error("perplexity provider not implemented yet");
  },
};
