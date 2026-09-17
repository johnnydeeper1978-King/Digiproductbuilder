// Edge Function: `builder` — the server-side Builder boundary.
// EVERY action: authenticate -> verify Builder entitlement (paid) -> load the
// user's OWN product -> validate request -> (for generate) call provider,
// validate shape, record ai_runs -> persist builder_state. Service role writes
// the Builder-managed columns the client is revoked from. No fake AI content.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { hasBuilderAccess } from "../_shared/entitlements.ts";
import { selectProvider } from "../_shared/ai/index.ts";
import { MissingProviderConfigError } from "../_shared/ai/resolveProvider.ts";
import {
  BUILDER_SYSTEM_PROMPT, BUILDER_PHASE_ORDER, buildPhaseUserMessage, type BuilderPhase,
} from "../_shared/prompts/builder.ts";
import { validateBuilderRequest } from "../_shared/builder/validateRequest.ts";

function initState() {
  return {
    version: 1, currentPhase: "strategy" as BuilderPhase, status: "in-progress",
    completedPhases: [] as string[], phases: {} as Record<string, unknown>,
    updatedAt: new Date().toISOString(),
  };
}
function phaseSlot(state: any, phase: string) {
  state.phases[phase] ??= { status: "not-started", inputs: {}, outputs: [], updatedAt: null };
  return state.phases[phase];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const v = validateBuilderRequest(body);
  if (!v.valid) return json({ error: v.error }, 400);
  const req0 = v.value!;

  // 1. Authenticate.
  const uid = await getCallerUid(req.headers.get("Authorization"));
  if (!uid) return json({ error: "unauthorized" }, 401);

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  // 2. Verify entitlement SERVER-SIDE.
  if (!(await hasBuilderAccess(admin, uid))) return json({ error: "builder_access_required" }, 403);

  // list / create don't target an existing product.
  if (req0.action === "list") {
    const { data } = await admin.from("products")
      .select("id,name,status,current_phase,progress,updated_at")
      .eq("user_id", uid).order("updated_at", { ascending: false });
    return json({ products: data ?? [] });
  }
  if (req0.action === "create") {
    const { data, error } = await admin.from("products").insert({
      user_id: uid, name: req0.name?.trim() || "My digital product",
      status: "draft", current_phase: "strategy", progress: 0,
      builder_state: initState(),
    }).select("id").maybeSingle();
    if (error) {
      const limit = error.message.includes("PRODUCT_LIMIT_REACHED");
      return json({ error: limit ? "product_limit_reached" : "db_error", message: error.message }, limit ? 409 : 500);
    }
    return json({ productId: data!.id }, 201);
  }

  // 3. Load the product and enforce ownership.
  const { data: product, error: pErr } = await admin.from("products")
    .select("*").eq("id", req0.productId!).maybeSingle();
  if (pErr) return json({ error: "db_error", message: pErr.message }, 500);
  if (!product) return json({ error: "product_not_found" }, 404);
  if (product.user_id !== uid) return json({ error: "forbidden" }, 403);

  // 4/5. Blueprint + profile context + current state.
  let blueprint: unknown = null, userProfile: unknown = null;
  if (product.blueprint_id) {
    const { data: bp } = await admin.from("blueprints").select("data").eq("id", product.blueprint_id).maybeSingle();
    blueprint = bp?.data ?? null;
  }
  if (product.discovery_session_id) {
    const { data: s } = await admin.from("discovery_sessions").select("user_profile").eq("id", product.discovery_session_id).maybeSingle();
    userProfile = s?.user_profile ?? null;
  }
  const state: any = product.builder_state ?? initState();

  const persist = async (extra: Record<string, unknown> = {}) => {
    state.updatedAt = new Date().toISOString();
    await admin.from("products").update({ builder_state: state, ...extra }).eq("id", product.id);
  };

  if (req0.action === "get") {
    return json({
      product: { id: product.id, name: product.name, status: product.status, current_phase: product.current_phase, progress: product.progress },
      blueprint, userProfile, builderState: state,
      hasBlueprint: Boolean(blueprint),
    });
  }

  if (req0.action === "input") {
    const slot = phaseSlot(state, req0.phase!);
    slot.inputs = { ...slot.inputs, ...req0.inputs };
    slot.status = "in-progress"; slot.updatedAt = new Date().toISOString();
    await persist();
    return json({ builderState: state });
  }

  if (req0.action === "goto") {
    state.currentPhase = req0.phase;
    await persist({ current_phase: req0.phase });
    return json({ builderState: state });
  }

  if (req0.action === "advance") {
    const slot = phaseSlot(state, req0.phase!);
    slot.status = "completed"; slot.updatedAt = new Date().toISOString();
    if (!state.completedPhases.includes(req0.phase)) state.completedPhases.push(req0.phase);
    const idx = BUILDER_PHASE_ORDER.indexOf(req0.phase as BuilderPhase);
    const next = BUILDER_PHASE_ORDER[Math.min(idx + 1, BUILDER_PHASE_ORDER.length - 1)];
    state.currentPhase = next;
    const progress = Math.round((state.completedPhases.length / BUILDER_PHASE_ORDER.length) * 100);
    await persist({ current_phase: next, progress });
    return json({ builderState: state, progress });
  }

  if (req0.action === "complete") {
    state.status = "completed";
    await persist({ status: "active", current_phase: "optimization", progress: 100 });
    return json({ builderState: state });
  }

  // action === "generate": the AI boundary.
  if (req0.action === "generate") {
    const slot = phaseSlot(state, req0.phase!);
    if (req0.inputs) slot.inputs = { ...slot.inputs, ...req0.inputs };

    const { data: run } = await admin.from("ai_runs").insert({
      user_id: uid, product_id: product.id, run_type: `builder_${req0.phase}`,
      status: "running", input_metadata: { phase: req0.phase },
    }).select("id").single();
    const fail = async (code: string, message: string, status: number, validation = "not_validated") => {
      if (run) await admin.from("ai_runs").update({
        status: "failed", error_code: code, error_message: message,
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

    // Prior phase outputs (latest per completed phase) as context — no re-asking.
    const priorOutputs: Record<string, unknown> = {};
    for (const p of state.completedPhases) {
      const outs = state.phases[p]?.outputs ?? [];
      if (outs.length) priorOutputs[p] = outs[outs.length - 1].data;
    }

    let completion;
    try {
      completion = await provider.complete({
        messages: [
          { role: "system", content: BUILDER_SYSTEM_PROMPT },
          { role: "user", content: buildPhaseUserMessage({ phase: req0.phase as BuilderPhase, blueprint, userProfile, priorOutputs, inputs: slot.inputs }) },
        ],
      });
    } catch (e) { return fail("ai_unavailable", String((e as Error).message), 502); }

    let parsed: any;
    try { parsed = completion.json ?? JSON.parse(completion.content); }
    catch { return fail("ai_output_unparseable", "Model output was not valid JSON", 422, "invalid"); }
    // No project JSON schema exists for Builder output; do a light shape check.
    if (typeof parsed !== "object" || parsed === null || typeof parsed.summary !== "string" || !Array.isArray(parsed.sections)) {
      return fail("builder_output_invalid", "Output did not match the expected Builder shape", 422, "invalid");
    }

    // Append a new output version (preserve prior versions for auditability/revision).
    slot.outputs.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), data: parsed });
    slot.status = "in-progress"; slot.updatedAt = new Date().toISOString();
    await persist();

    if (run) await admin.from("ai_runs").update({
      status: "succeeded", validation_status: "valid",
      provider: completion.provider, model: completion.model, output: parsed,
      finished_at: new Date().toISOString(),
    }).eq("id", run.id);

    return json({ output: parsed, builderState: state });
  }

  return json({ error: "unknown_action" }, 400);
});
