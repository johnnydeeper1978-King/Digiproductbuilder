// Edge Function: `discovery-analyze` — the Discovery AI boundary.
// Flow: validate request -> load session + raw answers (service role) ->
// usage guards -> call the provider with the real schema -> record usage ->
// validate against discovery-output schema -> persist opportunities -> return.
//
// This step returns the profile + opportunities only. The Blueprint is a
// separate paid-for-by-us call (blueprint-generate) after the user selects.
// No fake output: failures return honest errors and are recorded in ai_runs.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { selectProvider } from "../_shared/ai/index.ts";
import { MissingProviderConfigError } from "../_shared/ai/resolveProvider.ts";
import { checkGlobalCap, checkSessionRun, MAX_TOKENS, usageColumns } from "../_shared/ai/limits.ts";
import { DISCOVERY_SYSTEM_PROMPT } from "../_shared/prompts/discovery.ts";
import { DISCOVERY_PROMPT_SCHEMAS, validateDiscoveryOutputData } from "../_shared/schema/validate.ts";
import { transcript } from "../_shared/discovery/questionBank.ts";

const RUN_TYPE = "discovery_analyze";

const STEP_INSTRUCTION =
  "THIS STEP: return userProfile, productOpportunities (exactly 3) and unexpectedOpportunities (2-3). " +
  "Give every opportunity a unique id: opp-1, opp-2, opp-3 for the main ones and unexp-1, unexp-2, unexp-3 " +
  "for the unexpected ones, and set isUnexpected accordingly. Do NOT include blueprint, selectedOpportunity " +
  "or score — the user selects an opportunity first and the Blueprint is generated in a later step.";

type Opp = Record<string, unknown> & { id?: string };

// deno-lint-ignore no-explicit-any
const followupDefs = (interview: any) =>
  Object.values(interview?.checkpoints ?? {}).flatMap((cp) => (cp as { questions?: [] }).questions ?? []);

function storedOutput(profile: unknown, rows: { data: Opp; is_unexpected: boolean }[]) {
  return {
    userProfile: profile ?? {},
    productOpportunities: rows.filter((r) => !r.is_unexpected).map((r) => r.data),
    unexpectedOpportunities: rows.filter((r) => r.is_unexpected).map((r) => r.data),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  // Locate the session by id (authenticated) or anon_token (anonymous).
  const sessionId = body.sessionId ? String(body.sessionId) : null;
  const anonToken = body.anonToken ? String(body.anonToken) : null;
  const uid = await getCallerUid(req.headers.get("Authorization"));

  const query = admin.from("discovery_sessions").select("*");
  const { data: session, error: sErr } =
    sessionId ? await query.eq("id", sessionId).maybeSingle()
              : anonToken ? await query.eq("anon_token", anonToken).maybeSingle()
              : { data: null, error: null };
  if (sErr) return json({ error: "db_error", message: sErr.message }, 500);
  if (!session) return json({ error: "session_not_found" }, 404);

  // Ownership check.
  if (session.user_id) {
    if (!uid || uid !== session.user_id) return json({ error: "forbidden" }, 403);
  } else if (!anonToken || anonToken !== session.anon_token) {
    return json({ error: "forbidden" }, 403);
  }

  // Usage guards. A repeat call returns the stored result for free.
  const gate = await checkSessionRun(admin, session.id, RUN_TYPE);
  if (!gate.ok && gate.code === "already_generated") {
    const { data: rows } = await admin.from("opportunities")
      .select("data, is_unexpected").eq("session_id", session.id).order("created_at");
    return json({ output: storedOutput(session.user_profile, rows ?? []), cached: true });
  }
  if (!gate.ok) return json({ error: gate.code, message: gate.message }, gate.status);
  const cap = await checkGlobalCap(admin);
  if (!cap.ok) return json({ error: cap.code, message: cap.message }, cap.status);

  // Structured-interview sessions must finish the interview first.
  const interview = session.interview ?? {};
  if (interview.checkpoints && !interview.done) return json({ error: "interview_incomplete" }, 400);

  const { data: answers, error: aErr } = await admin
    .from("discovery_answers").select("*").eq("session_id", session.id).order("sequence");
  if (aErr) return json({ error: "db_error", message: aErr.message }, 500);
  if (!answers || answers.length === 0) return json({ error: "no_answers" }, 400);

  const userProfile = session.user_profile ?? {};

  // Open the audit record.
  const { data: run } = await admin.from("ai_runs").insert({
    user_id: session.user_id, session_id: session.id,
    run_type: RUN_TYPE, status: "running", started_at: new Date().toISOString(),
    input_metadata: { answer_count: answers.length },
  }).select("id").single();

  const fail = async (code: string, message: string, status: number, validation = "not_validated") => {
    if (run) await admin.from("ai_runs").update({
      status: "failed", error_code: code, error_message: message.slice(0, 2000),
      validation_status: validation, finished_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json({ error: code, message }, status);
  };

  // Select a configured provider — honest error if none.
  let provider;
  try { provider = selectProvider(); }
  catch (e) {
    if (e instanceof MissingProviderConfigError) return fail("ai_not_configured", e.message, 501);
    return fail("provider_error", String((e as Error).message), 500);
  }

  let completion;
  try {
    completion = await provider.complete({
      messages: [
        { role: "system", content: `${DISCOVERY_SYSTEM_PROMPT}\n\n${STEP_INSTRUCTION}` },
        { role: "user", content: `Existing profile (may be empty): ${JSON.stringify(userProfile)}\n\nInterview:\n${transcript(answers, followupDefs(interview))}` },
      ],
      jsonSchema: DISCOVERY_PROMPT_SCHEMAS,
      maxTokens: MAX_TOKENS.discovery_analyze,
    });
  } catch (e) {
    return fail("ai_unavailable", String((e as Error).message), 502);
  }

  // Record what this call cost before anything else can fail.
  if (run) await admin.from("ai_runs").update(usageColumns(completion)).eq("id", run.id);
  if (completion.stopReason === "max_tokens") {
    return fail("ai_output_truncated", "Model output hit the token limit", 502, "invalid");
  }

  const parsed = completion.json;
  if (parsed === undefined) return fail("ai_output_unparseable", "Model output was not valid JSON", 422, "invalid");

  const output = parsed as {
    sessionId?: string; generatedAt?: string; status?: string;
    userProfile?: unknown; productOpportunities?: Opp[]; unexpectedOpportunities?: Opp[];
    selectedOpportunity?: unknown; blueprint?: unknown;
  };
  // This step never selects or blueprints; drop them if the model added them anyway.
  delete output.selectedOpportunity;
  delete output.blueprint;
  // Server-owned metadata: never trust model-invented ids or dates.
  output.sessionId = session.id;
  output.generatedAt = new Date().toISOString();
  output.status = "opportunities-generated";

  const result = validateDiscoveryOutputData(output);
  if (!result.valid) return fail("ai_output_invalid", result.errors.join("; "), 422, "invalid");

  // Stable refs are required by `discovery` -> select. Assign them if missing
  // or duplicated, and write them back into the data the client receives.
  const seen = new Set<string>();
  const withRef = (list: Opp[] | undefined, prefix: string, unexpected: boolean) =>
    (list ?? []).map((o, i) => {
      let ref = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `${prefix}-${i + 1}`;
      if (seen.has(ref)) ref = `${prefix}-${i + 1}-${crypto.randomUUID().slice(0, 4)}`;
      seen.add(ref);
      o.id = ref;
      return { session_id: session.id, opportunity_ref: ref, data: o, is_unexpected: unexpected };
    });
  const rows = [
    ...withRef(output.productOpportunities, "opp", false),
    ...withRef(output.unexpectedOpportunities, "unexp", true),
  ];
  if (rows.length === 0) return fail("ai_output_invalid", "No opportunities returned", 422, "invalid");

  const { error: insErr } = await admin.from("opportunities").insert(rows);
  if (insErr) return fail("db_error", insErr.message, 500, "valid");

  const sessionUpdate: Record<string, unknown> = { status: "opportunities-generated" };
  const hasProfile = session.user_profile && Object.keys(session.user_profile).length > 0;
  if (!hasProfile && output.userProfile) sessionUpdate.user_profile = output.userProfile;
  await admin.from("discovery_sessions").update(sessionUpdate).eq("id", session.id);

  if (run) await admin.from("ai_runs").update({
    status: "succeeded", validation_status: "valid",
    finished_at: new Date().toISOString(),
  }).eq("id", run.id);

  return json({ output });
});
