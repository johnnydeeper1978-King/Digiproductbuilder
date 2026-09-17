// openai adapter (server-side, Deno). STUB: no live calls yet, no fake output.
// Implement against the real openai API in the AI phase, reading the key from
// Deno.env. It must throw (not fabricate) until implemented.
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./provider.ts";

export const openaiProvider: AIProvider = {
  name: "openai",
  async complete(_req: AICompletionRequest): Promise<AICompletionResponse> {
    throw new Error("openai provider not implemented yet");
  },
};
