// Edge Function: `discovery`
// Session + answer lifecycle for ANONYMOUS visitors (and a claim step for
// sign-up). Uses the service role, so it enforces ownership itself:
//   - anonymous rows are scoped strictly by anon_token
//   - claim requires a valid JWT (uid) and matches by anon_token
// No provider keys here; no fake data.
//
// Actions (POST body { action, ... }):
//   start                       -> creates a session, returns { id, anon_token }
//   get    { anonToken }        -> returns { session, answers }
//   answer { anonToken, question_key, question_text?, answer, sequence? }
//   claim  { anonToken }        -> links the anon session to the caller's uid
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = String(body.action ?? "");

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  if (action === "start") {
    const { data, error } = await admin
      .from("discovery_sessions")
      .insert({ status: "in-progress" })
      .select("id, anon_token")
      .single();
    if (error) return json({ error: "db_error", message: error.message }, 500);
    return json({ session: data }, 201);
  }

  const anonToken = String(body.anonToken ?? "");
  if (!anonToken) return json({ error: "missing_anon_token" }, 400);

  // Ownership: the row must match the presented anon_token.
  const { data: session, error: sErr } = await admin
    .from("discovery_sessions").select("*").eq("anon_token", anonToken).maybeSingle();
  if (sErr) return json({ error: "db_error", message: sErr.message }, 500);
  if (!session) return json({ error: "not_found" }, 404);

  if (action === "get") {
    const { data: answers, error: aErr } = await admin
      .from("discovery_answers").select("*").eq("session_id", session.id).order("sequence");
    if (aErr) return json({ error: "db_error", message: aErr.message }, 500);
    return json({ session, answers: answers ?? [] });
  }

  if (action === "answer") {
    const question_key = String(body.question_key ?? "");
    if (!question_key) return json({ error: "missing_question_key" }, 400);
    if (body.answer === undefined) return json({ error: "missing_answer" }, 400);
    const { data, error } = await admin.from("discovery_answers").upsert({
      session_id: session.id,
      question_key,
      question_text: body.question_text ?? null,
      answer: body.answer,
      sequence: body.sequence ?? null,
    }, { onConflict: "session_id,question_key" }).select("*").single();
    if (error) return json({ error: "db_error", message: error.message }, 500);
    return json({ answer: data });
  }

  if (action === "profile") {
    const { data, error } = await admin.from("discovery_sessions").update({
      user_profile: body.user_profile ?? session.user_profile,
      metadata: body.metadata ?? session.metadata,
    }).eq("id", session.id).select("id").single();
    if (error) return json({ error: "db_error", message: error.message }, 500);
    return json({ session: data });
  }

  if (action === "select") {
    const ref = String(body.opportunity_ref ?? "");
    if (!ref) return json({ error: "missing_opportunity_ref" }, 400);
    // Single selection per session.
    await admin.from("opportunities").update({ is_selected: false }).eq("session_id", session.id);
    const { data, error } = await admin.from("opportunities")
      .update({ is_selected: true }).eq("session_id", session.id).eq("opportunity_ref", ref)
      .select("id").maybeSingle();
    if (error) return json({ error: "db_error", message: error.message }, 500);
    if (!data) return json({ error: "opportunity_not_found" }, 404);
    await admin.from("discovery_sessions").update({ status: "opportunity-selected" }).eq("id", session.id);
    return json({ selected: data });
  }

  if (action === "claim") {
    const uid = await getCallerUid(req.headers.get("Authorization"));
    if (!uid) return json({ error: "unauthorized" }, 401);
    if (session.user_id && session.user_id !== uid) return json({ error: "forbidden" }, 403);
    const { data, error } = await admin
      .from("discovery_sessions").update({ user_id: uid })
      .eq("id", session.id).select("id, user_id").single();
    if (error) return json({ error: "db_error", message: error.message }, 500);
    return json({ session: data });
  }

  return json({ error: "unknown_action" }, 400);
});
