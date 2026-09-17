/**
 * Client Discovery service.
 *
 * - Authenticated users write directly to Supabase (RLS enforces ownership).
 * - Anonymous visitors go through the `discovery` edge function (service role,
 *   scoped by anon_token) — there is no permissive anon RLS policy.
 * - Analysis always goes through the `discovery-analyze` edge function (the AI
 *   boundary). No provider keys touch the browser; no fake output.
 *
 * When Supabase is not configured, methods throw a clear error (no fakes).
 */
import { requireSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/client";
import { env, isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import type { UserProfile } from "@/types/schemas/user-profile";
import type { DiscoveryOutput } from "@/types/schemas/discovery-output";
import type { Blueprint } from "@/types/schemas/blueprint";
import type { AnswerValue } from "@/features/discovery/types";

export interface SessionRef { id: string; anonToken: string | null; }
export interface AnswerInput {
  question_key: string; question_text?: string; answer: AnswerValue; sequence?: number;
}

async function callEdge<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
  const session = await authService.getSession().catch(() => null);
  const res = await fetch(`${env.supabaseUrl}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.supabaseAnonKey as string,
      Authorization: `Bearer ${session?.access_token ?? env.supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string; error?: string }).message
      ?? (data as { error?: string }).error ?? `Request failed (${res.status})`;
    throw new DiscoveryError(msg, (data as { error?: string }).error, res.status);
  }
  return data as T;
}

export class DiscoveryError extends Error {
  code?: string; status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message); this.name = "DiscoveryError"; this.code = code; this.status = status;
  }
}

async function currentUserId(): Promise<string | null> {
  const s = await authService.getSession().catch(() => null);
  return s?.user?.id ?? null;
}

export const discoveryService = {
  /** Start a new session. Authed -> direct insert; anon -> edge `start`. */
  async start(): Promise<SessionRef> {
    const uid = await currentUserId();
    if (uid) {
      const { data, error } = await requireSupabase()
        .from("discovery_sessions").insert({ user_id: uid, status: "in-progress" })
        .select("id, anon_token").single();
      if (error) throw new DiscoveryError(error.message, "db_error");
      return { id: data.id, anonToken: null };
    }
    const { session } = await callEdge<{ session: { id: string; anon_token: string } }>(
      "discovery", { action: "start" });
    return { id: session.id, anonToken: session.anon_token };
  },

  /** Resume: authed -> latest in-progress session; anon -> by token. */
  async resume(anonToken: string | null): Promise<{ ref: SessionRef; answers: AnswerInput[] } | null> {
    const uid = await currentUserId();
    if (uid) {
      const { data: s } = await requireSupabase()
        .from("discovery_sessions").select("id")
        .eq("user_id", uid).eq("status", "in-progress")
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (!s) return null;
      const { data: answers } = await requireSupabase()
        .from("discovery_answers").select("question_key, question_text, answer, sequence")
        .eq("session_id", s.id).order("sequence");
      return { ref: { id: s.id, anonToken: null }, answers: (answers ?? []) as AnswerInput[] };
    }
    if (!anonToken) return null;
    const { session, answers } = await callEdge<{
      session: { id: string; anon_token: string } | null; answers: AnswerInput[];
    }>("discovery", { action: "get", anonToken });
    if (!session) return null;
    return { ref: { id: session.id, anonToken: session.anon_token }, answers: answers ?? [] };
  },

  /** Upsert a single raw answer (idempotent per session+question_key). */
  async saveAnswer(ref: SessionRef, input: AnswerInput): Promise<void> {
    const uid = await currentUserId();
    if (uid) {
      const { error } = await requireSupabase().from("discovery_answers").upsert({
        session_id: ref.id, question_key: input.question_key,
        question_text: input.question_text ?? null, answer: input.answer,
        sequence: input.sequence ?? null,
      }, { onConflict: "session_id,question_key" });
      if (error) throw new DiscoveryError(error.message, "db_error");
      return;
    }
    await callEdge("discovery", { action: "answer", anonToken: ref.anonToken, ...input });
  },

  /** Persist the deterministically-mapped profile onto the session. */
  async saveProfile(ref: SessionRef, userProfile: UserProfile, metadata: Record<string, unknown>): Promise<void> {
    const uid = await currentUserId();
    if (uid) {
      const { error } = await requireSupabase().from("discovery_sessions")
        .update({ user_profile: userProfile, metadata }).eq("id", ref.id);
      if (error) throw new DiscoveryError(error.message, "db_error");
      return;
    }
    await callEdge("discovery", { action: "profile", anonToken: ref.anonToken, user_profile: userProfile, metadata });
  },

  /** Run the Discovery AI analysis (server-side). Honest error if unconfigured. */
  async analyze(ref: SessionRef): Promise<DiscoveryOutput> {
    const body = ref.anonToken ? { anonToken: ref.anonToken } : { sessionId: ref.id };
    const { output } = await callEdge<{ output: DiscoveryOutput }>("discovery-analyze", body);
    return output;
  },

  /** After sign-up: link an anonymous session to the authenticated user. */
  async claim(anonToken: string): Promise<void> {
    await callEdge("discovery", { action: "claim", anonToken });
  },

  /** Persist the selected opportunity (single selection per session). */
  async selectOpportunity(ref: SessionRef, opportunityRef: string): Promise<void> {
    const uid = await currentUserId();
    if (uid) {
      const sb = requireSupabase();
      await sb.from("opportunities").update({ is_selected: false }).eq("session_id", ref.id);
      const { data, error } = await sb.from("opportunities")
        .update({ is_selected: true }).eq("session_id", ref.id).eq("opportunity_ref", opportunityRef)
        .select("id").maybeSingle();
      if (error) throw new DiscoveryError(error.message, "db_error");
      if (!data) throw new DiscoveryError("Opportunity not found", "not_found", 404);
      await sb.from("discovery_sessions").update({ status: "opportunity-selected" }).eq("id", ref.id);
      return;
    }
    await callEdge("discovery", { action: "select", anonToken: ref.anonToken, opportunity_ref: opportunityRef });
  },

  /** Generate the Blueprint from the selected opportunity (server-side AI). */
  async generateBlueprint(ref: SessionRef): Promise<{ blueprint: Blueprint; blueprintId: string; productId: string | null; productNote: string | null }> {
    const body = ref.anonToken ? { anonToken: ref.anonToken } : { sessionId: ref.id };
    return callEdge("blueprint-generate", body);
  },

  /** Fetch the latest stored Blueprint for an authenticated user's session. */
  async getBlueprintForSession(sessionId: string): Promise<Blueprint | null> {
    const uid = await currentUserId();
    if (!uid) return null;
    const { data } = await requireSupabase().from("blueprints")
      .select("data").eq("session_id", sessionId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return (data?.data as Blueprint) ?? null;
  },

  /** Fetch stored results for an authenticated user's session. */
  async getResults(sessionId: string): Promise<DiscoveryOutput | null> {
    const uid = await currentUserId();
    if (!uid) return null;
    const sb = requireSupabase();
    const { data: session } = await sb.from("discovery_sessions")
      .select("user_profile, status").eq("id", sessionId).maybeSingle();
    if (!session) return null;
    const { data: opps } = await sb.from("opportunities")
      .select("data, is_unexpected, is_selected").eq("session_id", sessionId);
    const { data: bp } = await sb.from("blueprints")
      .select("data").eq("session_id", sessionId).maybeSingle();
    return {
      userProfile: (session.user_profile ?? {}) as UserProfile,
      productOpportunities: (opps ?? []).filter((o) => !o.is_unexpected).map((o) => o.data),
      unexpectedOpportunities: (opps ?? []).filter((o) => o.is_unexpected).map((o) => o.data),
      selectedOpportunity: (opps ?? []).find((o) => o.is_selected)?.data,
      blueprint: bp?.data,
    };
  },
};
