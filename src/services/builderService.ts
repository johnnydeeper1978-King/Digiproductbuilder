/**
 * Builder client service. Every call goes through the `builder` edge function,
 * which authenticates, verifies entitlement server-side, and enforces product
 * ownership. The browser never writes Builder state directly (the DB revokes
 * those columns from the client role).
 */
import { env, isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { SupabaseNotConfiguredError } from "@/lib/supabase/client";
import type { BuilderPhase, BuilderState, BuilderContextResponse, BuilderOutput } from "@/features/builder/builderTypes";

export class BuilderError extends Error {
  code?: string; status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message); this.name = "BuilderError"; this.code = code; this.status = status;
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
  const session = await authService.getSession().catch(() => null);
  if (!session?.access_token) throw new BuilderError("Please sign in.", "unauthorized", 401);
  const res = await fetch(`${env.supabaseUrl}/functions/v1/builder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.supabaseAnonKey as string,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string; error?: string }).message
      ?? (data as { error?: string }).error ?? `Builder request failed (${res.status})`;
    throw new BuilderError(msg, (data as { error?: string }).error, res.status);
  }
  return data as T;
}

export const builderService = {
  list: () => call<{ products: { id: string; name: string; status: string; current_phase: string; progress: number; updated_at: string }[] }>({ action: "list" }),
  create: (name?: string) => call<{ productId: string }>({ action: "create", name }),
  get: (productId: string) => call<BuilderContextResponse>({ action: "get", productId }),
  saveInputs: (productId: string, phase: BuilderPhase, inputs: Record<string, unknown>) =>
    call<{ builderState: BuilderState }>({ action: "input", productId, phase, inputs }),
  generate: (productId: string, phase: BuilderPhase, inputs?: Record<string, unknown>) =>
    call<{ output: BuilderOutput["data"]; builderState: BuilderState }>({ action: "generate", productId, phase, inputs }),
  advance: (productId: string, phase: BuilderPhase) =>
    call<{ builderState: BuilderState; progress: number }>({ action: "advance", productId, phase }),
  goto: (productId: string, phase: BuilderPhase) =>
    call<{ builderState: BuilderState }>({ action: "goto", productId, phase }),
  complete: (productId: string) => call<{ builderState: BuilderState }>({ action: "complete", productId }),
};
