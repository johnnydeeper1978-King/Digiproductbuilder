/**
 * Client-side AI service.
 *
 * The browser NEVER calls model providers directly. This service is the
 * single client entry point; it will POST to a Supabase Edge Function that
 * holds the provider keys and performs schema validation server-side.
 *
 * The endpoint is not implemented in this foundation phase. Rather than
 * returning fake data, calls throw NotImplementedError. Wire this up in the
 * Discovery phase by pointing it at the deployed edge function.
 */
import type { AICompletionRequest, AICompletionResponse } from "@/lib/ai/types";

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} is not implemented yet.`);
    this.name = "NotImplementedError";
  }
}

export const aiService = {
  async complete(_req: AICompletionRequest): Promise<AICompletionResponse> {
    // TODO(discovery-phase): POST _req to `${SUPABASE_URL}/functions/v1/ai`.
    throw new NotImplementedError("Server-side AI completion");
  },
};
