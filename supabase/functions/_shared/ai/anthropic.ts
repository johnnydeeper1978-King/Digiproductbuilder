// Anthropic adapter (server-side, Deno). Calls the Messages API with the key
// from Deno.env. Never fabricates output: any API failure throws.
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./provider.ts";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_MAX_TOKENS = 4000;
const TIMEOUT_MS = 120_000;

// USD per million tokens (list price) — used only for the est_cost_usd audit
// column. Add a row when switching ANTHROPIC_MODEL to another model.
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-sonnet-5": { input: 2, output: 10 },
};

/** Parse JSON from model text, tolerating code fences or stray prose. */
export function extractJson(text: string): unknown | undefined {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }
  return undefined;
}

type AnthropicResponse = {
  model?: string;
  stop_reason?: string;
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { type?: string; message?: string };
};

async function post(key: string, body: unknown): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = {
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  // Only needed for keys that aren't scoped to a workspace.
  const workspace = Deno.env.get("ANTHROPIC_WORKSPACE_ID");
  if (workspace) headers["anthropic-workspace-id"] = workspace;
  try {
    return await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
    const model = req.model ?? Deno.env.get("ANTHROPIC_MODEL") ?? DEFAULT_MODEL;

    // The schemas use additionalProperties:false throughout, so the model must
    // see the real schema text — a bare $ref would fail validation every time.
    const schemaNote = req.jsonSchema
      ? "\n\nThe JSON you return MUST validate against the JSON Schema below (draft 2020-12). " +
        "Honour required fields, enums and additionalProperties:false exactly; omit optional " +
        "fields rather than inventing new ones. Return one JSON object and nothing else.\n" +
        JSON.stringify(req.jsonSchema)
      : "";
    const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: system + schemaNote,
      messages,
    };
    if (req.temperature !== undefined) body.temperature = req.temperature;

    // One retry only, and only for transient upstream errors (rate limit / overload / 5xx).
    let res = await post(key, body);
    if (res.status === 429 || res.status === 529 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000));
      res = await post(key, body);
    }

    const data = (await res.json().catch(() => ({}))) as AnthropicResponse;
    if (!res.ok) {
      throw new Error(`anthropic ${res.status} ${data.error?.type ?? ""}: ${data.error?.message ?? "request failed"}`);
    }

    const content = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const usedModel = data.model ?? model;
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;
    const price = PRICES[usedModel] ?? PRICES[model];
    const estCostUsd = price
      ? (inputTokens * price.input + outputTokens * price.output) / 1_000_000
      : undefined;

    return {
      provider: "anthropic",
      model: usedModel,
      content,
      json: extractJson(content),
      usage: { inputTokens, outputTokens },
      estCostUsd,
      stopReason: data.stop_reason,
    };
  },
};
