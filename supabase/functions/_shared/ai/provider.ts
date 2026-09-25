// Server-side (Deno) AI provider abstraction. Runs ONLY in Supabase Edge
// Functions, where API keys live in Deno.env. Never import this from src/.
//
// Provider-agnostic contract shared by openai.ts / anthropic.ts / perplexity.ts.
export type AIProviderName = "openai" | "anthropic" | "perplexity";

export interface AIMessage { role: "system" | "user" | "assistant"; content: string; }
export interface AICompletionRequest {
  provider?: AIProviderName;
  model?: string;
  messages: AIMessage[];
  /** Schema(s) the output must satisfy. Sent to the model as instructions. */
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  /** Hard output cap. Every caller must set one (cost control). */
  maxTokens?: number;
}
export interface AIUsage { inputTokens: number; outputTokens: number; }
export interface AICompletionResponse {
  provider: AIProviderName;
  model: string;
  content: string;
  json?: unknown;
  usage?: AIUsage;
  /** Estimated from list prices; not an invoice. */
  estCostUsd?: number;
  /** e.g. "end_turn" or "max_tokens" (truncated output). */
  stopReason?: string;
}
export interface AIProvider {
  readonly name: AIProviderName;
  complete(req: AICompletionRequest): Promise<AICompletionResponse>;
}

// Registry so the orchestrator can pick a provider by name at runtime.
export const providerRegistry = new Map<AIProviderName, AIProvider>();
export function registerProvider(p: AIProvider) { providerRegistry.set(p.name, p); }
export function getProvider(name: AIProviderName): AIProvider {
  const p = providerRegistry.get(name);
  if (!p) throw new Error(`AI provider not registered: ${name}`);
  return p;
}
