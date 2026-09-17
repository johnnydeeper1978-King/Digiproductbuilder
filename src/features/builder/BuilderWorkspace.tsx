import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { SupabaseNotConfiguredError } from "@/lib/supabase/client";
import { builderService } from "@/services/builderService";
import { BUILDER_PHASES, PHASE_BY_ID } from "./phases";
import type { BuilderContextResponse, BuilderPhase, BuilderState } from "./builderTypes";
import { cn } from "@/utils/cn";

export function BuilderWorkspace() {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<BuilderContextResponse | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [active, setActive] = useState<BuilderPhase>("strategy");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { products } = await builderService.list();
      const pid = products[0]?.id ?? (await builderService.create()).productId;
      const context = await builderService.get(pid);
      setProductId(pid); setCtx(context); setActive(context.builderState.currentPhase);
    } catch (e) {
      if (e instanceof SupabaseNotConfiguredError) { setPreview(true); }
      else setError(e instanceof Error ? e.message : "Couldn't load the Builder.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingState label="Loading your Builder…" />;
  if (error) return <ErrorState title="Builder unavailable" message={error} onRetry={load} />;

  // Preview (no backend configured): show the real guided structure, read-only.
  if (preview || !ctx || !productId) {
    return (
      <div style={{ maxWidth: 900 }}>
        <span className="eyebrow">Builder unlocked</span>
        <h1>Your product Builder</h1>
        <div className="d-notice">
          The backend + AI aren't configured in this environment, so guidance and saving aren't live here.
          Below is the exact guided structure you'll move through.
        </div>
        <div className="builder-grid">
          <PhaseRail active={active} onPick={setActive} />
          <PhasePanelStatic phase={active} />
        </div>
      </div>
    );
  }

  return <LiveWorkspace productId={productId} ctx={ctx} setCtx={setCtx} active={active} setActive={setActive} />;
}

function PhaseRail({ active, onPick, state }:
  { active: BuilderPhase; onPick: (p: BuilderPhase) => void; state?: BuilderState }) {
  return (
    <nav className="phase-rail">
      {BUILDER_PHASES.map((p, i) => {
        const st = state?.phases?.[p.id]?.status;
        const done = state?.completedPhases?.includes(p.id);
        return (
          <button key={p.id} className={cn("phase-item", active === p.id && "phase-item-active")} onClick={() => onPick(p.id)}>
            <span className={cn("phase-dot", done && "phase-dot-done", st === "in-progress" && "phase-dot-active")}>{i + 1}</span>
            {p.label}
          </button>
        );
      })}
    </nav>
  );
}

function PhasePanelStatic({ phase }: { phase: BuilderPhase }) {
  const def = PHASE_BY_ID[phase];
  return (
    <Card>
      <span className="eyebrow">{def.label}</span>
      <ThreeQuestions def={def} />
      <p className="dim" style={{ fontSize: "0.8rem", marginTop: "var(--space-4)" }}>
        Guided AI output and saving appear here once the backend is live.
      </p>
    </Card>
  );
}

function ThreeQuestions({ def }: { def: (typeof BUILDER_PHASES)[number] }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p><small className="meta-label">What this is</small><br />{def.what}</p>
      <p><small className="meta-label">Why it matters</small><br />{def.why}</p>
      <p><small className="meta-label">What to do next</small><br />{def.next}</p>
    </div>
  );
}

function LiveWorkspace({ productId, ctx, setCtx, active, setActive }: {
  productId: string; ctx: BuilderContextResponse;
  setCtx: (c: BuilderContextResponse) => void; active: BuilderPhase; setActive: (p: BuilderPhase) => void;
}) {
  const def = PHASE_BY_ID[active];
  const state = ctx.builderState;
  const slot = state.phases[active];
  const [draft, setDraft] = useState<string>(() => String((slot?.inputs?.notes as string) ?? ""));
  const [busy, setBusy] = useState<null | "save" | "generate" | "advance">(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setDraft(String((state.phases[active]?.inputs?.notes as string) ?? "")); }, [active, state]);

  const patch = (s: BuilderState) => setCtx({ ...ctx, builderState: s });

  const save = async () => {
    setBusy("save"); setErr(null);
    try { const { builderState } = await builderService.saveInputs(productId, active, { notes: draft }); patch(builderState); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed."); } finally { setBusy(null); }
  };
  const generate = async () => {
    setBusy("generate"); setErr(null);
    try { const { builderState } = await builderService.generate(productId, active, { notes: draft }); patch(builderState); }
    catch (e) { setErr(e instanceof Error ? e.message : "Generation failed."); } finally { setBusy(null); }
  };
  const advance = async () => {
    setBusy("advance"); setErr(null);
    try { const { builderState } = await builderService.advance(productId, active); patch(builderState); setActive(builderState.currentPhase); }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't advance."); } finally { setBusy(null); }
  };

  const outputs = state.phases[active]?.outputs ?? [];
  const latest = outputs[outputs.length - 1];

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div><span className="eyebrow">Builder</span><h1 style={{ margin: 0 }}>{ctx.product.name}</h1></div>
        <span className="dim">{ctx.product.progress}% complete</span>
      </div>
      {!ctx.hasBlueprint && (
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Direct start (no Discovery blueprint) — the guide collects only what it needs as you go.
        </p>
      )}
      <div className="builder-grid" style={{ marginTop: "var(--space-6)" }}>
        <PhaseRail active={active} onPick={setActive} state={state} />
        <div>
          <Card>
            <span className="eyebrow">{def.label}</span>
            <ThreeQuestions def={def} />
            <label className="meta-label" style={{ display: "block", marginTop: "var(--space-4)" }}>Your input</label>
            <textarea className="d-textarea" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="Add anything relevant for this step. The guide uses it — and your blueprint — to produce this phase's output." />
            <div className="row" style={{ marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="sm" onClick={save} disabled={busy !== null}>{busy === "save" ? "Saving…" : "Save"}</Button>
              <Button size="sm" onClick={generate} disabled={busy !== null}>{busy === "generate" ? "Generating…" : latest ? "Regenerate" : "Generate guidance"}</Button>
              <Button variant="ghost" size="sm" onClick={advance} disabled={busy !== null}>Mark complete & continue →</Button>
            </div>
            {err && <p className="d-field-error">{err}</p>}
          </Card>

          {latest && (
            <Card style={{ marginTop: "var(--space-4)" }}>
              <span className="eyebrow">Output</span>
              <p style={{ marginTop: 6 }}>{latest.data.summary}</p>
              {latest.data.sections?.map((s, i) => (
                <div key={i} style={{ marginTop: 10 }}><strong>{s.title}</strong><p className="muted" style={{ marginTop: 2 }}>{s.body}</p></div>
              ))}
              {latest.data.nextStep && <p style={{ marginTop: 10 }}><small className="meta-label">Next step</small><br />{latest.data.nextStep}</p>}
              {outputs.length > 1 && <p className="dim" style={{ fontSize: "0.75rem", marginTop: 8 }}>{outputs.length} versions saved (previous versions are preserved).</p>}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
