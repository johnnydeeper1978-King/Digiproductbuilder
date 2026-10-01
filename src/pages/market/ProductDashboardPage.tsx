import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService, AccessError } from "@/services/catalogService";
import { MkState, ProgressBar } from "@/features/catalog/components";
import { loginPath, useSession } from "@/features/catalog/useSession";
import type { DashboardData } from "@/features/catalog/types";

const POLL_MS = 3000;
const POLL_LIMIT_MS = 120_000;

export function ProductDashboardPage() {
  const { key = "" } = useParams();
  const [params] = useSearchParams();
  const fromCheckout = params.get("checkout") === "success";
  const session = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [state, setState] = useState<"loading" | "confirming" | "timeout" | "denied" | "error" | "ok">("loading");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const d = await catalogService.dashboard(key);
      setData(d); setState("ok");
    } catch (e) {
      if (e instanceof AccessError && e.code === "not_entitled") {
        // Payment confirmation arrives by webhook — wait for it after checkout.
        if (fromCheckout && Date.now() - started.current < POLL_LIMIT_MS) { setState("confirming"); return "retry"; }
        setState(fromCheckout ? "timeout" : "denied"); return;
      }
      setError((e as Error).message); setState("error");
    }
  }, [key, fromCheckout]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    let t: number | undefined;
    const tick = async () => { const r = await load(); if (active && r === "retry") t = window.setTimeout(tick, POLL_MS); };
    void tick();
    return () => { active = false; window.clearTimeout(t); };
  }, [session, load]);

  if (session === null) return <Navigate to={loginPath(`/library/${key}${fromCheckout ? "?checkout=success" : ""}`)} replace />;
  if (state === "denied") return <Navigate to={`/marketplace/${key}`} replace />;

  if (state === "confirming" || (state === "loading" && fromCheckout)) {
    return <div className="container mk-pad"><MkState loading title="Confirming your payment…" message="This usually takes a few seconds. Please keep this page open." /></div>;
  }
  if (state === "timeout") {
    return (
      <div className="container mk-pad">
        <MkState title="We're still waiting for payment confirmation"
          message="If your payment went through, your access will appear shortly. Make sure you're signed in with the same email you used at checkout, then refresh. If it still doesn't appear, contact us and we'll sort it out."
          action={<div className="mk-row"><button className="btn primary" onClick={() => window.location.reload()}>Refresh</button><Link className="btn outline" to="/contact">Contact support</Link></div>} />
      </div>
    );
  }
  if (state === "error") return <div className="container mk-pad"><MkState title="This page didn't load" message={error ?? undefined} action={<button className="btn outline" onClick={() => window.location.reload()}>Try again</button>} /></div>;
  if (!data) return <div className="container mk-pad"><MkState loading title="Loading your system…" /></div>;

  const { product: p, modules, progress: pr, vault, os } = data;
  const byLesson = pr.byLesson ?? {};
  const continueTo = pr.nextLessonId ? `/learn/${pr.nextLessonId}` : `/library/${p.key}/os`;
  const vaultByModule = new Map<number, typeof vault>();
  for (const v of vault) {
    const pos = v.module?.position ?? 0;
    vaultByModule.set(pos, [...(vaultByModule.get(pos) ?? []), v]);
  }

  return (
    <section className="mk-section mk-pad">
      <Seo title={p.title} />
      <div className="container">
        <Link className="mk-back" to="/library">← My Library</Link>
        {fromCheckout && <div className="mk-banner">Payment confirmed — welcome! Your system is ready below.</div>}
        {data.completed && (
          <div className="mk-banner mk-banner-done">
            <b>{os.title ? `${os.title.replace(/ Builder$/, "")} is built.` : "Your system is built."}</b> You've completed every lesson and assembled your system. <Link to={`/library/${p.key}/os`}>Open your system →</Link>
          </div>
        )}

        <div className="mk-dash-head">
          <div>
            <h1>{p.title}</h1>
            <p className="mk-muted">
              {pr.currentModule ? <>You're on <b>Module {pr.currentModule.position}: {pr.currentModule.title}</b></> : "All lessons complete"}
              {" · "}{pr.completed}/{pr.lessons} lessons · {pr.modulesCompleted}/{pr.modules} modules
            </p>
            <ProgressBar percent={pr.percent} />
          </div>
          <div className="mk-dash-cta">
            <div className="mk-pct">{pr.percent}%</div>
            <Link className="btn primary" to={continueTo}>{pr.completed === 0 ? "Start Module 1 →" : pr.nextLessonId ? "Continue →" : "Open your system →"}</Link>
          </div>
        </div>

        <div className="mk-dash-grid">
          <div>
            <h2 className="mk-h2">Modules</h2>
            <div className="mk-modules">
              {modules.map((m) => {
                const done = m.lessons.filter((l) => byLesson[l.id] === "completed").length;
                const complete = m.lessons.length > 0 && done === m.lessons.length;
                const current = pr.currentModule?.position === m.position;
                return (
                  <details key={m.id} className={`mk-module ${complete ? "is-done" : ""} ${current ? "is-current" : ""}`} open={current}>
                    <summary>
                      <span className="mk-mnum">{complete ? "✓" : String(m.position).padStart(2, "0")}</span>
                      <span className="mk-mtitle">{m.title}{m.outcome && <small>Output: {m.outcome}</small>}</span>
                      <span className="mk-mcount">{done}/{m.lessons.length}</span>
                    </summary>
                    <ol className="mk-lessons">
                      {m.lessons.map((l) => (
                        <li key={l.id} className={byLesson[l.id] === "completed" ? "done" : ""}>
                          <Link to={`/learn/${l.id}`}>
                            <span className="mk-ldot" aria-hidden>{byLesson[l.id] === "completed" ? "✓" : ""}</span>
                            {l.title}
                            {l.est_minutes ? <span className="mk-min">{l.est_minutes} min</span> : null}
                          </Link>
                        </li>
                      ))}
                    </ol>
                    {(vaultByModule.get(m.position) ?? []).length > 0 && (
                      <div className="mk-mtools">
                        {(vaultByModule.get(m.position) ?? []).map((v) => (
                          <Link key={v.key} to={`/library/${p.key}/tools/${v.key}`} className={v.savedAt ? "saved" : ""}>
                            {v.savedAt ? "✓ " : ""}{v.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </div>

          <aside className="mk-side">
            <div className="mk-os-card">
              <div className="eyebrow">YOUR FINAL SYSTEM</div>
              <h3>{os.title?.replace(/ Builder$/, "") ?? "Your system"}</h3>
              <p className="mk-small">{os.built ? "Built — open it any time to review or update." : "Assemble it in Module 12 from everything you've saved along the way."}</p>
              <Link className="btn dark" to={`/library/${p.key}/os`}>{os.built ? "Open your system →" : "View builder →"}</Link>
            </div>
            <div className="mk-vault">
              <h3>Resource vault</h3>
              <p className="mk-small">{vault.filter((v) => v.savedAt).length} of {vault.length} filled in</p>
              <ul>
                {vault.map((v) => (
                  <li key={v.key}>
                    <Link to={`/library/${p.key}/tools/${v.key}`}>
                      <span className={`mk-vdot ${v.savedAt ? "on" : ""}`} aria-hidden />
                      {v.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
