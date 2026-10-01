import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService, AccessError } from "@/services/catalogService";
import { MkState, ProgressBar } from "@/features/catalog/components";
import { loginPath, useSession } from "@/features/catalog/useSession";
import { EntrySummary, ResourceTool } from "@/features/catalog/ResourceTool";
import type { OsData } from "@/features/catalog/types";

/** Where "start using your system" sends people, per product (from the specs). */
const START: Record<string, { label: string; tool: string; title: string }> = {
  "adhd-system": { title: "Your Productivity OS is built.", label: "Start Using Your System →", tool: "p4-flexible-daily-planner" },
  "budgeting-system": { title: "Your 2026 Money OS is built.", label: "Start Your First Weekly Money Check-In →", tool: "p5-weekly-money-check-in" },
};

export function OsPage() {
  const { key = "" } = useParams();
  const session = useSession();
  const [data, setData] = useState<OsData | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [built, setBuilt] = useState(false);

  useEffect(() => {
    if (!session) return;
    let active = true;
    catalogService.os(key).then((d) => {
      if (!active) return;
      setData(d);
      const f = (d.builder.entry?.data as { fields?: Record<string, unknown> } | undefined)?.fields ?? {};
      setBuilt(Object.values(f).some((v) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "")));
    }).catch((e) => {
      if (!active) return;
      if (e instanceof AccessError && e.code === "not_entitled") setDenied(true); else setError((e as Error).message);
    });
    return () => { active = false; };
  }, [session, key]);

  if (session === null) return <Navigate to={loginPath(`/library/${key}/os`)} replace />;
  if (denied) return <Navigate to={`/marketplace/${key}`} replace />;
  if (error) return <div className="container mk-pad"><MkState title="This page didn't load" message={error} /></div>;
  if (!data) return <div className="container mk-pad"><MkState loading title="Loading your system…" /></div>;

  const pr = data.progress;
  const allLessons = pr.lessons > 0 && pr.completed === pr.lessons;
  const done = allLessons && built;
  const start = START[key];
  const name = data.builder.title.replace(/ Builder$/, "");

  return (
    <section className="mk-section mk-pad">
      <Seo title={name} />
      <div className="container mk-os">
        <Link className="mk-back" to={`/library/${key}`}>← Back to dashboard</Link>

        {done && start ? (
          <div className="mk-os-done">
            <div className="eyebrow">COMPLETE</div>
            <h1>{start.title}</h1>
            <p>Everything you've built is below. Come back to it whenever life gets messy — it's designed to be restarted, not to be perfect.</p>
            <Link className="btn primary" to={`/library/${key}/tools/${start.tool}`}>{start.label}</Link>
          </div>
        ) : (
          <div className="mk-page-head">
            <div className="eyebrow">YOUR FINAL SYSTEM</div>
            <h1>{name}</h1>
            <p className="mk-muted">Your system is assembled from the worksheets and trackers you've saved in each module, plus the final choices below.</p>
            <ProgressBar percent={pr.percent} />
            <p className="mk-small">{pr.completed}/{pr.lessons} lessons complete{!allLessons && pr.nextLessonId ? <> · <Link to={`/learn/${pr.nextLessonId}`}>Continue your lessons →</Link></> : null}{allLessons && !built ? " · Fill in and save the final choices below to finish." : ""}</p>
          </div>
        )}

        <h2 className="mk-h2">The parts of your system</h2>
        <div className="mk-os-parts">
          {data.pulled.map((r) => (
            <div key={r.key} className="mk-os-part">
              <div className="mk-os-part-head">
                <div>
                  <span className="mk-small">{r.module ? `Module ${r.module.position}` : ""}</span>
                  <h3>{r.title}</h3>
                </div>
                <Link className="mk-link" to={`/library/${key}/tools/${r.key}`}>{r.entry ? "Edit" : "Fill in"} →</Link>
              </div>
              <EntrySummary def={r} data={r.entry?.data ?? null} />
            </div>
          ))}
        </div>
        <div className="mk-os-builder" style={{ marginTop: 40 }}>
          <h2 className="mk-h2">Your final choices</h2>
          <ResourceTool def={data.builder} initial={data.builder.entry?.data ?? null} savedAt={data.builder.entry?.savedAt}
            onSave={async (d) => {
              const at = (await catalogService.saveEntry(data.builder.key, d)).savedAt;
              const f = (d as { fields?: Record<string, unknown> }).fields ?? {};
              setBuilt(Object.values(f).some((v) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "")));
              return at;
            }} />
        </div>

      </div>
    </section>
  );
}
