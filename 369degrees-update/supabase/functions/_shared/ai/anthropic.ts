// Anthropic adapter (server-side, Deno). Calls the real Messages API using the
// key from Deno.env. Never fabricates: on any API error it throws, which the
// callers surface as an honest error and record as a failed ai_run.
import type { AIProvider, AICompletionRequest, AICompletionResponse } from "./provider.ts";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-3-5-sonnet-20241022"; // override with ANTHROPIC_MODEL

/** Best-effort extraction of a JSON object from model text (handles code fences). */
function parseJson(text: string): { clean: string; json?: unknown } {
  let clean = text.trim();
  const fence = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) clean = fence[1].trim();
  try { return { clean, json: JSON.parse(clean) }; } catch { /* try substring */ }
  const first = clean.indexOf("{"); const last = clean.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const slice = clean.slice(first, last + 1);
    try { return { clean: slice, json: JSON.parse(slice) }; } catch { /* give up */ }
  }
  return { clean };
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
    const model = req.model ?? Deno.env.get("ANTHROPIC_MODEL") ?? DEFAULT_MODEL;
    const maxTokens = Number(Deno.env.get("ANTHROPIC_MAX_TOKENS") ?? "8192");

    // Anthropic takes `system` at the top level; messages are user/assistant only.
    const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: req.temperature ?? 0.7,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = await res.json();
    const text = (data?.content ?? [])
      .filter((b: { type?: string }) => b?.type === "text")
      .map((b: { text?: string }) => b?.text ?? "")
      .join("");
    const { clean, json } = parseJson(text);
    return { provider: "anthropic", model: data?.model ?? model, content: clean, json };
  },
};
