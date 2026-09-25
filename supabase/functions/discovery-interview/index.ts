// Edge Function: `discovery-interview` — the structured Discovery interview.
//   action "next"   -> the next question (structured, or an AI follow-up), or done
//   action "answer" -> validate + save one answer, then return the next question
// Structured questions cost nothing. After sections 2 and 4 an AI checkpoint
// asks 3–5 follow-ups in ONE call. A failed or over-budget checkpoint is
// skipped, never blocking the user. When done, the client calls
// discovery-analyze.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { selectProvider } from "../_shared/ai/index.ts";
import { checkGlobalCap, checkSessionRun, MAX_TOKENS, usageColumns } from "../_shared/ai/limits.ts";
import { INTERVIEW_CHECKPOINT_PROMPT } from "../_shared/prompts/interview.ts";
import { INTERVIEW_PROMPT_SCHEMA, validateInterviewFollowup } from "../_shared/schema/validate.ts";
import {
  type Answer, type Answers, CHECKPOINTS, describe, isAnswered, type Option, type QuestionType,
  QUESTIONS, SECTIONS, validateAnswer, visibleQuestions,
} from "../_shared/discovery/questionBank.ts";

type CpId = "cp1" | "cp2";
interface FollowUp { key: string; text: string; why?: string; type: QuestionType; options?: Option[]; targets?: string; }
interface Checkpoint { questions?: FollowUp[]; skipped?: boolean; reason?: string; generatedAt?: string; }
interface Interview { checkpoints?: Partial<Record<CpId, Checkpoint>>; done?: boolean; completedAt?: string; }

const EST_FOLLOWUPS_PER_CP = 4;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "option";

function allQuestionDefs(interview: Interview) {
  const map = new Map<string, { text: string; type: QuestionType; options?: Option[]; allowOther: boolean; required: boolean; section: number; why?: string; source: "bank" | "ai_followup"; seq: number }>();
  QUESTIONS.forEach((q, i) => map.set(q.key, { ...q, source: "bank", seq: i + 1 }));
  for (const [ci, cp] of CHECKPOINTS.entries()) {
    (interview.checkpoints?.[cp.id]?.questions ?? []).forEach((f, i) => map.set(f.key, {
      text: f.text, why: f.why, type: f.type, options: f.options, allowOther: f.type !== "text",
      required: false, section: cp.afterSection, source: "ai_followup", seq: 100 + ci * 10 + i,
    }));
  }
  return map;
}

type Step =
  | { kind: "question"; key: string }
  | { kind: "checkpoint_due"; id: CpId }
  | { kind: "done" };

function computeNext(answers: Answers, saved: Set<string>, interview: Interview): Step {
  const vis = visibleQuestions(answers);
  for (const section of [1, 2, 3, 4] as const) {
    for (const q of vis.filter((x) => x.section === section)) {
      const ok = q.required ? isAnswered(q, answers[q.key]) : saved.has(q.key);
      if (!ok) return { kind: "question", key: q.key };
    }
    const cp = CHECKPOINTS.find((c) => c.afterSection === section);
    if (!cp) continue;
    const state = interview.checkpoints?.[cp.id];
    if (!state) return { kind: "checkpoint_due", id: cp.id };
    if (state.skipped) continue;
    const pending = (state.questions ?? []).find((f) => !saved.has(f.key));
    if (pending) return { kind: "question", key: pending.key };
  }
  return { kind: "done" };
}

function progress(answers: Answers, saved: Set<string>, interview: Interview) {
  const bank = visibleQuestions(answers);
  let total = bank.length, answered = bank.filter((q) => saved.has(q.key)).length;
  for (const cp of CHECKPOINTS) {
    const st = interview.checkpoints?.[cp.id];
    if (st?.skipped) continue;
    const qs = st?.questions;
    total += qs ? qs.length : EST_FOLLOWUPS_PER_CP;
    if (qs) answered += qs.filter((f) => saved.has(f.key)).length;
  }
  return { answered, total, percent: Math.min(100, Math.round((answered / total) * 100)) };
}

async function generateCheckpoint(
  admin: SupabaseClient, session: { id: string; user_id: string | null }, id: CpId,
  answers: Answers, interview: Interview,
): Promise<Checkpoint | { error: string; message: string; status: number }> {
  const runType = `discovery_checkpoint_${id}`;
  const gate = await checkSessionRun(admin, session.id, runType);
  if (!gate.ok && gate.code === "in_progress") return { error: "in_progress", message: gate.message, status: 409 };
  if (!gate.ok) return { skipped: true, reason: gate.code };
  const cap = await checkGlobalCap(admin);
  if (!cap.ok) return { skipped: true, reason: cap.code };

  let provider;
  try { provider = selectProvider(); } catch { return { skipped: true, reason: "ai_not_configured" }; }

  const defs = allQuestionDefs(interview);
  const transcript = Object.entries(answers)
    .filter(([k, a]) => a && defs.has(k))
    .sort(([a], [b]) => defs.get(a)!.seq - defs.get(b)!.seq)
    .map(([k, a]) => describe(defs.get(k)!, a!))
    .join("\n\n");
  const scope = id === "cp1"
    ? "Checkpoint 1 of 2. Sections covered so far: You; Who you can help. Focus on skills, experience, the specific audience, their problem and desired outcome."
    : "Checkpoint 2 of 2 (final). The whole interview is complete. Fill the most important remaining gaps before product opportunities are generated.";

  const { data: run } = await admin.from("ai_runs").insert({
    user_id: session.user_id, session_id: session.id, run_type: runType,
    status: "running", started_at: new Date().toISOString(),
    input_metadata: { answer_count: Object.keys(answers).length },
  }).select("id").single();
  const finish = async (fields: Record<string, unknown>) => {
    if (run) await admin.from("ai_runs").update({ finished_at: new Date().toISOString(), ...fields }).eq("id", run.id);
  };

  let completion;
  try {
    completion = await provider.complete({
      messages: [
        { role: "system", content: `${INTERVIEW_CHECKPOINT_PROMPT}\n\n${scope}` },
        { role: "user", content: transcript },
      ],
      jsonSchema: INTERVIEW_PROMPT_SCHEMA,
      maxTokens: MAX_TOKENS.discovery_checkpoint,
    });
  } catch (e) {
    await finish({ status: "failed", error_code: "ai_unavailable", error_message: String((e as Error).message).slice(0, 2000) });
    return { skipped: true, reason: "ai_unavailable" };
  }
  if (run) await admin.from("ai_runs").update(usageColumns(completion)).eq("id", run.id);

  // Normalise cosmetic overruns (long text, extra keys, >5 questions) instead of
  // discarding an otherwise good checkpoint; structure is still validated.
  type RawQ = { text: string; why?: string; type: QuestionType; options?: string[]; targets?: string };
  const raw = completion.json as { questions?: unknown } | undefined;
  const parsed = raw && Array.isArray(raw.questions)
    ? { questions: (raw.questions as Record<string, unknown>[]).slice(0, 5).map((q) => {
        const out: Record<string, unknown> = { text: String(q.text ?? "").slice(0, 300), type: q.type, targets: q.targets };
        if (typeof q.why === "string") out.why = q.why.slice(0, 200);
        if (Array.isArray(q.options)) out.options = q.options.slice(0, 8).map((x) => String(x).slice(0, 80));
        return out as unknown as RawQ;
      }) }
    : undefined;
  const check = parsed ? validateInterviewFollowup(parsed) : { valid: false, errors: ["unparseable"] };
  if (!parsed || !check.valid || completion.stopReason === "max_tokens") {
    await finish({ status: "failed", error_code: "ai_output_invalid", validation_status: "invalid", error_message: check.errors.join("; ").slice(0, 2000) });
    return { skipped: true, reason: "ai_output_invalid" };
  }

  const questions: FollowUp[] = parsed.questions!.map((q, i) => {
    // A choice question without options can't be answered as a choice.
    const type: QuestionType = q.type !== "text" && (!q.options || q.options.length < 2) ? "text" : q.type;
    const seen = new Set<string>();
    const options = type === "text" ? undefined : q.options!.map((label) => {
      let value = slug(label);
      while (seen.has(value)) value += "-x";
      seen.add(value);
      return { value, label };
    });
    return { key: `${id}_${i + 1}`, text: q.text, why: q.why, type, options, targets: q.targets };
  });
  await finish({ status: "succeeded", validation_status: "valid", output: parsed });
  return { questions, generatedAt: new Date().toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = body.action;
  if (action !== "next" && action !== "answer") return json({ error: "unknown_action" }, 400);

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  const sessionId = body.sessionId ? String(body.sessionId) : null;
  const anonToken = body.anonToken ? String(body.anonToken) : null;
  const uid = await getCallerUid(req.headers.get("Authorization"));

  const q = admin.from("discovery_sessions").select("id, user_id, anon_token, interview");
  const { data: session, error: sErr } =
    sessionId ? await q.eq("id", sessionId).maybeSingle()
              : anonToken ? await q.eq("anon_token", anonToken).maybeSingle()
              : { data: null, error: null };
  if (sErr) return json({ error: "db_error", message: sErr.message }, 500);
  if (!session) return json({ error: "session_not_found" }, 404);
  if (session.user_id) {
    if (!uid || uid !== session.user_id) return json({ error: "forbidden" }, 403);
  } else if (!anonToken || anonToken !== session.anon_token) {
    return json({ error: "forbidden" }, 403);
  }

  const interview: Interview = session.interview ?? {};
  const { data: rows, error: aErr } = await admin.from("discovery_answers")
    .select("question_key, answer").eq("session_id", session.id);
  if (aErr) return json({ error: "db_error", message: aErr.message }, 500);
  const answers: Answers = {};
  const saved = new Set<string>();
  for (const r of rows ?? []) { answers[r.question_key] = r.answer as Answer; saved.add(r.question_key); }

  if (action === "answer") {
    if (interview.done) return json({ error: "interview_complete" }, 409);
    const key = typeof body.key === "string" ? body.key : "";
    const defs = allQuestionDefs(interview);
    const def = defs.get(key);
    const visible = def && (def.source === "ai_followup" || visibleQuestions(answers).some((x) => x.key === key));
    if (!def || !visible) return json({ error: "unknown_question" }, 400);
    let answer = body.answer as Answer | undefined;
    if (!def.required && (!answer || Object.keys(answer).length === 0)) answer = { choice: [] as string[] };
    const err = def.required || (answer && (answer.text || answer.other || (Array.isArray(answer.choice) ? answer.choice.length : answer.choice)))
      ? validateAnswer(def, answer) : null;
    if (err) return json({ error: err }, 400);
    const { error: upErr } = await admin.from("discovery_answers").upsert({
      session_id: session.id, question_key: key, question_text: def.text,
      answer, sequence: def.seq, source: def.source,
    }, { onConflict: "session_id,question_key" });
    if (upErr) return json({ error: "db_error", message: upErr.message }, 500);
    answers[key] = answer;
    saved.add(key);
  }

  let step = computeNext(answers, saved, interview);
  if (step.kind === "checkpoint_due") {
    const cp = await generateCheckpoint(admin, session, step.id, answers, interview);
    if ("error" in cp) return json({ error: cp.error, message: cp.message }, cp.status);
    interview.checkpoints = { ...(interview.checkpoints ?? {}), [step.id]: cp };
    await admin.from("discovery_sessions").update({ interview }).eq("id", session.id);
    step = computeNext(answers, saved, interview);
  }

  if (step.kind === "done") {
    if (!interview.done) {
      interview.done = true;
      interview.completedAt = new Date().toISOString();
      await admin.from("discovery_sessions").update({ interview }).eq("id", session.id);
    }
    return json({ step: { kind: "done" }, progress: progress(answers, saved, interview) });
  }
  if (step.kind !== "question") return json({ error: "internal_state" }, 500);

  const def = allQuestionDefs(interview).get(step.key)!;
  return json({
    step: {
      kind: "question",
      question: {
        key: step.key, section: def.section, sectionTitle: SECTIONS[def.section].title,
        sectionIntro: SECTIONS[def.section].intro, text: def.text, why: def.why ?? null,
        type: def.type, options: def.options ?? [], allowOther: def.allowOther,
        required: def.required, source: def.source,
        previous: answers[step.key] ?? null,
      },
    },
    progress: progress(answers, saved, interview),
  });
});
