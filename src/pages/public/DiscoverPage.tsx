import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { isSupabaseConfigured } from "@/config/env";
import {
  discoveryService, DiscoveryError, type InterviewAnswer, type InterviewQuestion, type SessionRef,
} from "@/services/discoveryService";
import { setStoredAnonToken, clearStoredAnonToken } from "@/features/discovery/storage";

const REF_KEY = "369d.discovery.ref";
const OUTPUT_KEY = "369d.discovery.output";

function loadRef(): SessionRef | null {
  try { const r = JSON.parse(localStorage.getItem(REF_KEY) ?? "null"); return r && typeof r.id === "string" ? r : null; } catch { return null; }
}
function saveRef(r: SessionRef | null) {
  try { if (r) localStorage.setItem(REF_KEY, JSON.stringify(r)); else localStorage.removeItem(REF_KEY); } catch { /* storage unavailable */ }
  if (r?.anonToken) setStoredAnonToken(r.anonToken);
}

type Phase = "intro" | "loading" | "question" | "thinking" | "analyzing" | "error";

/**
 * Free Product Discovery — the structured interview (25–30 questions in four
 * sections, plus 3–5 AI follow-ups at two checkpoints). The server decides the
 * order and validates answers; AI is only called at the two checkpoints and
 * for the final analysis, each capped server-side.
 */
export function DiscoverPage() {
  const navigate = useNavigate();
  const [ref, setRef] = useState<SessionRef | null>(() => loadRef());
  const [phase, setPhase] = useState<Phase>("intro");
  const [q, setQ] = useState<InterviewQuestion | null>(null);
  const [progress, setProgress] = useState({ answered: 0, total: 30, percent: 0 });
  const [answer, setAnswer] = useState<InterviewAnswer>({});
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [lastSection, setLastSection] = useState<number>(0);

  const analyze = useCallback(async (r: SessionRef) => {
    setPhase("analyzing");
    try {
      const output = await discoveryService.analyze(r);
      try { sessionStorage.setItem(OUTPUT_KEY, JSON.stringify({ output, sessionId: r.id })); } catch { /* ignore */ }
      navigate("/discover/results", { state: { output, sessionId: r.id } });
    } catch (e) {
      setError(friendly(e)); setPhase("error");
    }
  }, [navigate]);

  const apply = useCallback(async (r: SessionRef, res: Awaited<ReturnType<typeof discoveryService.interviewNext>>) => {
    setProgress(res.progress);
    if (res.step.kind === "done") { await analyze(r); return; }
    const nq = res.step.question;
    setQ(nq);
    setAnswer(nq.previous ?? {});
    setFieldError(null);
    setPhase("question");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [analyze]);

  const begin = async () => {
    setError(null); setPhase("loading");
    try {
      let r = ref;
      if (!r) { r = await discoveryService.start(); saveRef(r); setRef(r); }
      try { await apply(r, await discoveryService.interviewNext(r)); }
      catch (e) {
        // Stale or foreign session: start a fresh one.
        if (e instanceof DiscoveryError && (e.status === 403 || e.status === 404)) {
          saveRef(null); clearStoredAnonToken();
          const fresh = await discoveryService.start(); saveRef(fresh); setRef(fresh);
          await apply(fresh, await discoveryService.interviewNext(fresh));
        } else throw e;
      }
    } catch (e) { setError(friendly(e)); setPhase("error"); }
  };

  // Returning visitors resume where they left off.
  useEffect(() => { if (ref) void begin(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async (skip = false) => {
    if (!q || !ref) return;
    const a: InterviewAnswer = skip ? {} : clean(answer);
    if (!skip) {
      const err = check(q, a);
      if (err) { setFieldError(err); return; }
    }
    setLastSection(q.section);
    setPhase("thinking"); setError(null);
    try { await apply(ref, await discoveryService.interviewAnswer(ref, q.key, a)); }
    catch (e) {
      if (e instanceof DiscoveryError && e.code === "interview_complete") { await analyze(ref); return; }
      if (e instanceof DiscoveryError && e.status === 400) { setFieldError(friendly(e)); setPhase("question"); return; }
      setError(friendly(e)); setPhase("error");
    }
  };

  const startOver = () => { saveRef(null); clearStoredAnonToken(); setRef(null); setQ(null); setPhase("intro"); };
  const newSection = q && q.section !== lastSection && q.source === "bank";

  return (
    <Container>
      <Seo title="Free Product Discovery" description="A guided interview that finds digital product opportunities that fit your skills, interests and the people you can help — free." />
      <div className="d-wrap">
        {phase === "intro" && (
          <div>
            <span className="eyebrow">Free Product Discovery</span>
            <h1>Let's find a digital product that actually fits you.</h1>
            <div className="d-intro-grid">
              <div><small>What is this?</small><p>A guided interview — about 30 questions in four short sections, mostly multiple choice. Twice along the way our AI reads your answers and asks 3–5 sharper follow-up questions.</p></div>
              <div><small>Why does it matter?</small><p>Most people pick a product because it's popular, not because it fits them. This matches ideas to your skills, time, goals and the people you can genuinely help.</p></div>
              <div><small>What do I get?</small><p>Personalised product opportunities with the reasoning behind each, then a free Product Guide for the one you choose — including 2–3 alternative directions.</p></div>
            </div>
            <p className="dim" style={{ fontSize: "0.85rem" }}>Takes about 10–15 minutes. Free, no card needed. You can stop and come back — your progress is saved on this device.</p>
            {!isSupabaseConfigured && <div className="d-notice">Discovery is temporarily unavailable. Please try again shortly.</div>}
            <div className="row wrap" style={{ marginTop: "var(--space-6)", gap: 12 }}>
              <Button onClick={begin} disabled={!isSupabaseConfigured}>{ref ? "Continue my Discovery →" : "Start Free Discovery →"}</Button>
              <Link className="btn btn-ghost" to="/marketplace">Already know what you need? Explore the Marketplace</Link>
            </div>
            {ref && <button className="d-linkbtn" onClick={startOver}>Start over instead</button>}
          </div>
        )}

        {(phase === "loading") && <LoadingState label="Getting your interview ready…" />}
        {phase === "thinking" && <LoadingState label={progress.answered > 0 && (progress.answered === 16 || lastSection === 4) ? "Reviewing your answers to ask a few sharper questions…" : "Saving…"} />}
        {phase === "analyzing" && (
          <div className="state">
            <LoadingState label="Analysing your answers and matching product opportunities…" />
            <p className="dim">This takes about 30–60 seconds. Please keep this page open.</p>
          </div>
        )}

        {phase === "question" && q && (
          <div>
            <div className="d-progress" aria-label={`${progress.percent}% complete`}><span style={{ width: `${progress.percent}%` }} /></div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="d-step-label">{q.source === "ai_followup" ? "Follow-up · tailored to your answers" : `Section ${q.section} of 4 · ${q.sectionTitle}`}</span>
              <span className="d-step-label">{progress.answered + 1} / ~{progress.total}</span>
            </div>
            {newSection && q.sectionIntro && <p className="d-section-intro">{q.sectionIntro}</p>}
            <h2 className="d-q-title">{q.text}</h2>
            {q.why && <p className="muted" style={{ fontSize: "0.92rem" }}>{q.why}</p>}

            <AnswerInput q={q} value={answer} onChange={(a) => { setAnswer(a); setFieldError(null); }} />
            {fieldError && <p className="d-field-error">{fieldError}</p>}

            <div className="d-nav">
              {!q.required ? <Button variant="ghost" onClick={() => submit(true)}>Skip</Button> : <span />}
              <Button onClick={() => submit(false)}>Next →</Button>
            </div>
            <p className="dim" style={{ fontSize: "0.78rem", marginTop: 10 }}>
              {q.required ? "Required." : "Optional."} Your answers are saved as you go — you can close this page and continue later.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="state">
            <h3>We couldn't continue just now</h3>
            <p className="muted">{error}</p>
            <div className="row wrap" style={{ justifyContent: "center", gap: 10 }}>
              <Button onClick={begin}>Try again</Button>
              <Button variant="ghost" onClick={startOver}>Start over</Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

function AnswerInput({ q, value, onChange }: { q: InterviewQuestion; value: InterviewAnswer; onChange: (a: InterviewAnswer) => void }) {
  if (q.type === "text") {
    return <textarea className="d-textarea" rows={4} maxLength={1000} value={value.text ?? ""} placeholder="Type your answer…"
      onChange={(e) => onChange({ text: e.target.value })} />;
  }
  const picks = value.choice === undefined ? [] : Array.isArray(value.choice) ? value.choice : [value.choice];
  const toggle = (v: string) => {
    if (q.type === "single") onChange({ ...value, choice: picks[0] === v ? [] : v });
    else onChange({ ...value, choice: picks.includes(v) ? picks.filter((x) => x !== v) : [...picks, v] });
  };
  return (
    <div>
      {q.type === "multi" && <p className="dim" style={{ fontSize: "0.8rem", margin: "0 0 8px" }}>Choose all that apply.</p>}
      <div className="opt-grid">
        {q.options.map((o) => (
          <button key={o.value} type="button" className={`opt ${picks.includes(o.value) ? "opt-active" : ""}`}
            aria-pressed={picks.includes(o.value)} onClick={() => toggle(o.value)}>{o.label}</button>
        ))}
      </div>
      {q.allowOther && (
        <input className="d-input" style={{ marginTop: 12 }} maxLength={300} value={value.other ?? ""}
          placeholder="Something else? Type it in your own words (optional)"
          onChange={(e) => onChange({ ...value, other: e.target.value })} />
      )}
    </div>
  );
}

function clean(a: InterviewAnswer): InterviewAnswer {
  const out: InterviewAnswer = {};
  if (a.text?.trim()) out.text = a.text.trim();
  if (a.other?.trim()) out.other = a.other.trim();
  if (Array.isArray(a.choice) ? a.choice.length : a.choice) out.choice = a.choice;
  return out;
}

function check(q: InterviewQuestion, a: InterviewAnswer): string | null {
  if (!q.required) return null;
  if (q.type === "text") return a.text ? null : "Please type an answer, or a short note if you're not sure.";
  const has = Array.isArray(a.choice) ? a.choice.length > 0 : Boolean(a.choice);
  return has || a.other ? null : "Please choose an option, or type your own answer.";
}

function friendly(e: unknown): string {
  const code = e instanceof DiscoveryError ? e.code : undefined;
  switch (code) {
    case "choice_required": return "Please choose an option, or type your own answer.";
    case "text_required": return "Please type an answer.";
    case "single_choice_only": return "Please choose just one option.";
    case "answer_too_long": return "That answer is a little long — please shorten it.";
    case "ai_daily_cap_reached":
      return "Discovery is very busy today and has reached its daily limit. Your answers are saved — please come back tomorrow and continue where you left off.";
    case "too_many_attempts":
      return "We couldn't analyse this session. Please start over, or contact us if it keeps happening.";
    case "in_progress": return "We're still working on your last step — please wait a few seconds and try again.";
    default: return e instanceof Error ? e.message : "Something went wrong. Please try again.";
  }
}
