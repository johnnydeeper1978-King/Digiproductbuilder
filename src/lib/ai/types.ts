/**
 * Provider-agnostic AI boundary (types only — no keys, no calls).
 *
 * These interfaces describe the contract the client uses to talk to a
 * SERVER-SIDE AI endpoint (Supabase Edge Function). Concrete providers
 * (OpenAI / Anthropic / Perplexity) are implemented server-side only, where
 * the API keys live. See supabase/functions/_shared/ai/.
 */
export type AIProviderName = "openai" | "anthropic" | "perplexity";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionRequest {
  provider?: AIProviderName;
  model?: string;
  messages: AIMessage[];
  /** When set, the server should request/validate structured JSON output. */
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
}

export interface AICompletionResponse {
  provider: AIProviderName;
  model: string;
  content: string;
  /** Populated when the response was validated against a JSON schema. */
  json?: unknown;
}

/** Contract implemented by each server-side provider adapter. */
export interface AIProvider {
  readonly name: AIProviderName;
  complete(req: AICompletionRequest): Promise<AICompletionResponse>;
}
