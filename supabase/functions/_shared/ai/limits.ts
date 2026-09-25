// AI usage guards (server-side). Every AI-calling function checks these BEFORE
// opening an ai_runs row or spending tokens. Caps are env-tunable.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { AICompletionResponse } from "./provider.ts";

function envNum(name: string, fallback: number): number {
  const v = Number(Deno.env.get(name));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const MAX_TOKENS = {
  discovery_analyze: 8000,
  blueprint_generate: 8000,
  builder: 6000,
  discovery_checkpoint: 1500,
} as const;

const IN_FLIGHT_WINDOW_MS = 3 * 60 * 1000;
const MAX_FAILED_PER_SESSION = 3;
// Failures that never reached the model don't count against a session.
const FREE_FAILURES = new Set(["ai_not_configured", "provider_error"]);

export type Gate =
  | { ok: true }
  | { ok: false; code: string; message: string; status: number };

const since24h = () => new Date(Date.now() - 24 * 3600 * 1000).toISOString();

/**
 * Platform-wide daily ceiling — the hard stop protecting credit. Primary limit
 * is spend (AI_DAILY_BUDGET_USD, default $1); a call-count ceiling
 * (AI_DAILY_RUN_CAP, default 300) backs it up in case cost logging fails.
 */
export async function checkGlobalCap(admin: SupabaseClient): Promise<Gate> {
  const budget = envNum("AI_DAILY_BUDGET_USD", 1);
  const cap = envNum("AI_DAILY_RUN_CAP", 300);
  const { data, error } = await admin.from("ai_runs")
    .select("est_cost_usd, status, input_tokens")
    .gte("created_at", since24h())
    .or("status.in.(running,succeeded),input_tokens.not.is.null")
    .limit(5000);
  if (error) return { ok: false, code: "db_error", message: error.message, status: 500 };
  const rows = data ?? [];
  const spent = rows.reduce((s, r) => s + Number(r.est_cost_usd ?? 0), 0);
  if (spent >= budget || rows.length >= cap) {
    return { ok: false, code: "ai_daily_cap_reached", message: "AI capacity for today is used up. Please try again tomorrow.", status: 429 };
  }
  return { ok: true };
}

/**
 * One successful run per session per run type. Returns code "already_generated"
 * so the caller can serve the stored result instead of paying again.
 */
export async function checkSessionRun(
  admin: SupabaseClient, sessionId: string, runType: string,
): Promise<Gate> {
  const { data, error } = await admin.from("ai_runs")
    .select("status, created_at, error_code")
    .eq("session_id", sessionId).eq("run_type", runType)
    .order("created_at", { ascending: false }).limit(25);
  if (error) return { ok: false, code: "db_error", message: error.message, status: 500 };
  const runs = data ?? [];
  if (runs.some((r) => r.status === "succeeded")) {
    return { ok: false, code: "already_generated", message: "Already generated for this session.", status: 200 };
  }
  if (runs.some((r) => r.status === "running" && Date.now() - Date.parse(r.created_at) < IN_FLIGHT_WINDOW_MS)) {
    return { ok: false, code: "in_progress", message: "Generation is already running. Please wait.", status: 409 };
  }
  const failed = runs.filter((r) => r.status === "failed" && !FREE_FAILURES.has(r.error_code ?? "")).length;
  if (failed >= MAX_FAILED_PER_SESSION) {
    return { ok: false, code: "too_many_attempts", message: "Too many failed attempts for this session.", status: 429 };
  }
  return { ok: true };
}

/** Per-user daily ceiling for paid Builder generations. */
export async function checkBuilderUserCap(admin: SupabaseClient, uid: string): Promise<Gate> {
  const cap = envNum("AI_BUILDER_DAILY_CAP", 20);
  const { count, error } = await admin.from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid).like("run_type", "builder_%")
    .gte("created_at", since24h())
    .or("status.in.(running,succeeded),input_tokens.not.is.null");
  if (error) return { ok: false, code: "db_error", message: error.message, status: 500 };
  if ((count ?? 0) >= cap) {
    return { ok: false, code: "builder_daily_cap_reached", message: "Daily Builder generation limit reached. It resets in 24 hours.", status: 429 };
  }
  return { ok: true };
}

/** ai_runs columns describing what a completion cost. */
export function usageColumns(c: AICompletionResponse) {
  return {
    provider: c.provider,
    model: c.model,
    input_tokens: c.usage?.inputTokens ?? null,
    output_tokens: c.usage?.outputTokens ?? null,
    est_cost_usd: c.estCostUsd ?? null,
    stop_reason: c.stopReason ?? null,
  };
}
