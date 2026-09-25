// Edge Function: `blueprint-generate` — the Blueprint AI boundary.
// validate request -> load session + SELECTED opportunity + profile -> usage
// guards -> provider (with the real schema) -> record usage -> validate against
// blueprint.schema.json -> persist blueprint -> associate/create product (authed).
// Honest error if AI unconfigured; never fabricates a Blueprint.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { selectProvider } from "../_shared/ai/index.ts";
import { MissingProviderConfigError } from "../_shared/ai/resolveProvider.ts";
import { checkGlobalCap, checkSessionRun, MAX_TOKENS, usageColumns } from "../_shared/ai/limits.ts";
import { BLUEPRINT_SYSTEM_PROMPT } from "../_shared/prompts/blueprint.ts";
import { BLUEPRINT_PROMPT_SCHEMAS, validateBlueprintData } from "../_shared/schema/validate.ts";

const RUN_TYPE = "blueprint_generate";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  const sessionId = body.sessionId ? String(body.sessionId) : null;
  const anonToken = body.anonToken ? String(body.anonToken) : null;
  const uid = await getCallerUid(req.headers.get("Authorization"));

  const q = admin.from("discovery_sessions").select("*");
  const { data: session, error: sErr } =
    sessionId ? await q.eq("id", sessionId).maybeSingle()
              : anonToken ? await q.eq("anon_token", anonToken).maybeSingle()
              : { data: null, error: null };
  if (sErr) return json({ error: "db_error", message: sErr.message }, 500);
  if (!session) return json({ error: "session_not_found" }, 404);

  // Ownership.
  if (session.user_id) {
    if (!uid || uid !== session.user_id) return json({ error: "forbidden" }, 403);
  } else if (!anonToken || anonToken !== session.anon_token) {
    return json({ error: "forbidden" }, 403);
  }

  // One Blueprint per session: a repeat call returns the stored one for free.
  const gate = await checkSessionRun(admin, session.id, RUN_TYPE);
  if (!gate.ok && gate.code === "already_generated") {
    const { data: bp } = await admin.from("blueprints").select("id, data")
      .eq("session_id", session.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: prod } = await admin.from("products").select("id")
      .eq("discovery_session_id", session.id).maybeSingle();
    return json({ blueprint: bp?.data ?? null, blueprintId: bp?.id ?? null, productId: prod?.id ?? null, productNote: null, cached: true });
  }
  if (!gate.ok) return json({ error: gate.code, message: gate.message }, gate.status);

  // The selected opportunity is required context.
  const { data: selected } = await admin.from("opportunities")
    .select("*").eq("session_id", session.id).eq("is_selected", true).maybeSingle();
  if (!selected) return json({ error: "no_selected_opportunity" }, 400);

  const cap = await checkGlobalCap(admin);
  if (!cap.ok) return json({ error: cap.code, message: cap.message }, cap.status);

  // Non-selected opportunities feed the guide's "other profitable opportunities".
  const { data: others } = await admin.from("opportunities")
    .select("data").eq("session_id", session.id).eq("is_selected", false).limit(6);

  const { data: run } = await admin.from("ai_runs").insert({
    user_id: session.user_id, session_id: session.id,
    run_type: RUN_TYPE, status: "running", started_at: new Date().toISOString(),
    input_metadata: { opportunity_id: selected.id },
  }).select("id").single();

  const fail = async (code: string, message: string, status: number, validation = "not_validated") => {
    if (run) await admin.from("ai_runs").update({
      status: "failed", error_code: code, error_message: message.slice(0, 2000),
      validation_status: validation, finished_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json({ error: code, message }, status);
  };

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
        { role: "system", content: BLUEPRINT_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ userProfile: session.user_profile ?? {}, selectedOpportunity: selected.data, otherOpportunities: (others ?? []).map((o) => o.data) }) },
      ],
      jsonSchema: BLUEPRINT_PROMPT_SCHEMAS,
      maxTokens: MAX_TOKENS.blueprint_generate,
    });
  } catch (e) { return fail("ai_unavailable", String((e as Error).message), 502); }

  if (run) await admin.from("ai_runs").update(usageColumns(completion)).eq("id", run.id);
  if (completion.stopReason === "max_tokens") {
    return fail("ai_output_truncated", "Model output hit the token limit", 502, "invalid");
  }

  const parsed = completion.json;
  if (parsed === undefined) return fail("ai_output_unparseable", "Model output was not valid JSON", 422, "invalid");

  const result = validateBlueprintData(parsed);
  if (!result.valid) return fail("blueprint_invalid", result.errors.join("; "), 422, "invalid");

  // Persist blueprint (raw answers untouched).
  const { data: bp, error: bpErr } = await admin.from("blueprints").insert({
    session_id: session.id, user_id: session.user_id,
    source_opportunity_ref: selected.opportunity_ref ?? selected.id, data: parsed,
  }).select("id").single();
  if (bpErr) return fail("db_error", bpErr.message, 500, "valid");

  await admin.from("discovery_sessions").update({ status: "blueprint-generated" }).eq("id", session.id);

  // Associate/create a product for authenticated users (no duplicate per session).
  let productId: string | null = null;
  let productNote: string | null = null;
  if (session.user_id) {
    const { data: existing } = await admin.from("products")
      .select("id").eq("discovery_session_id", session.id).maybeSingle();
    if (existing) {
      await admin.from("products").update({ blueprint_id: bp.id, opportunity_id: selected.id }).eq("id", existing.id);
      productId = existing.id;
    } else {
      const name = (parsed as { product?: { name?: string } }).product?.name ?? "My digital product";
      const { data: created, error: pErr } = await admin.from("products").insert({
        user_id: session.user_id, name, status: "draft", current_phase: "strategy",
        discovery_session_id: session.id, blueprint_id: bp.id, opportunity_id: selected.id,
      }).select("id").maybeSingle();
      if (pErr) productNote = pErr.message.includes("PRODUCT_LIMIT_REACHED")
        ? "Blueprint saved, but you already have 3 products — archive one to create a project from this."
        : pErr.message;
      else productId = created?.id ?? null;
    }
  }

  if (run) await admin.from("ai_runs").update({
    status: "succeeded", validation_status: "valid",
    finished_at: new Date().toISOString(),
  }).eq("id", run.id);

  return json({ blueprint: parsed, blueprintId: bp.id, productId, productNote });
});
