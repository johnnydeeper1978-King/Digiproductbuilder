// Edge Function: `discovery-analyze`  — the Discovery AI boundary.
// Flow: validate request -> load session + raw answers (service role) ->
// build the deterministic user profile -> construct AI input from the project
// prompt -> call the provider abstraction -> validate output against the
// discovery-output schema -> record an ai_runs audit row -> persist
// opportunities/blueprint -> return validated output.
//
// No provider keys in the client. No fake output: if no provider is configured
// (or the adapter is not implemented) an honest error is returned and the
// ai_runs row records the failure. Scoring is intentionally NOT computed.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { selectProvider } from "../_shared/ai/index.ts";
import { MissingProviderConfigError } from "../_shared/ai/resolveProvider.ts";
import { DISCOVERY_SYSTEM_PROMPT } from "../_shared/prompts/discovery.ts";
import { validateDiscoveryOutputData } from "../_shared/schema/validate.ts";

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

  const { data: answers, error: aErr } = await admin
    .from("discovery_answers").select("*").eq("session_id", session.id).order("sequence");
  if (aErr) return json({ error: "db_error", message: aErr.message }, 500);
  if (!answers || answers.length === 0) return json({ error: "no_answers" }, 400);

  const userProfile = session.user_profile ?? {};

  // Open the audit record.
  const { data: run } = await admin.from("ai_runs").insert({
    user_id: session.user_id, session_id: session.id,
    run_type: "discovery_analyze", status: "running",
    input_metadata: { answer_count: answers.length },
  }).select("id").single();

  const fail = async (code: string, message: string, status: number, validation = "not_validated") => {
    if (run) await admin.from("ai_runs").update({
      status: "failed", error_code: code, error_message: message,
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

  // Call the provider. Adapters are stubs today (throw), so this returns an
  // honest error rather than fabricated output.
  let completion;
  try {
    completion = await provider.complete({
      messages: [
        { role: "system", content: DISCOVERY_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ userProfile, answers: answers.map((a) => ({ q: a.question_key, a: a.answer })) }) },
      ],
      jsonSchema: { $ref: "https://369degrees.co.za/schemas/discovery-output.schema.json" },
    });
  } catch (e) {
    return fail("ai_unavailable", String((e as Error).message), 502);
  }

  // Validate the model output against the discovery-output schema.
  let parsed: unknown;
  try { parsed = completion.json ?? JSON.parse(completion.content); }
  catch { return fail("ai_output_unparseable", "Model output was not valid JSON", 422, "invalid"); }

  const result = validateDiscoveryOutputData(parsed);
  if (!result.valid) return fail("ai_output_invalid", result.errors.join("; "), 422, "invalid");

  // Persist opportunities + blueprint (raw answers are untouched). Scoring is
  // NOT computed here.
  const output = parsed as {
    productOpportunities?: unknown[]; unexpectedOpportunities?: unknown[];
    selectedOpportunity?: { id?: string }; blueprint?: unknown;
  };
  const rows = [
    ...(output.productOpportunities ?? []).map((o) => ({ session_id: session.id, data: o, is_unexpected: false })),
    ...(output.unexpectedOpportunities ?? []).map((o) => ({ session_id: session.id, data: o, is_unexpected: true })),
  ];
  if (rows.length) await admin.from("opportunities").insert(rows);
  if (output.blueprint) {
    await admin.from("blueprints").insert({
      session_id: session.id, user_id: session.user_id, data: output.blueprint,
      source_opportunity_ref: output.selectedOpportunity?.id ?? null,
    });
  }
  await admin.from("discovery_sessions").update({
    status: output.blueprint ? "blueprint-generated" : "opportunities-generated",
  }).eq("id", session.id);
  if (run) await admin.from("ai_runs").update({
    status: "succeeded", validation_status: "valid",
    provider: completion.provider, model: completion.model,
    finished_at: new Date().toISOString(),
  }).eq("id", run.id);

  return json({ output: parsed });
});
