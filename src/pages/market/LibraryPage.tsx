import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService } from "@/services/catalogService";
import { MkState, ProgressBar, statusLabel } from "@/features/catalog/components";
import { loginPath, useSession } from "@/features/catalog/useSession";
import type { LibraryData } from "@/features/catalog/types";

export function LibraryPage() {
  const session = useSession();
  const [data, setData] = useState<LibraryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    catalogService.library().then((d) => active && setData(d))
      .catch((e) => active && setError((e as Error).message));
    return () => { active = false; };
  }, [session]);

  if (session === null) return <Navigate to={loginPath("/library")} replace />;

  return (
    <section className="mk-section mk-pad">
      <Seo title="My Library" />
      <div className="container">
        <div className="mk-page-head">
          <div className="eyebrow">MY LIBRARY</div>
          <h1>Your systems</h1>
          <p className="mk-muted">Everything you own, with your progress. Pick up exactly where you left off.</p>
        </div>

        {!data && !error && <MkState loading title="Loading your library…" />}
        {error && <MkState title="Your library didn't load" message={error} action={<button className="btn outline" onClick={() => window.location.reload()}>Try again</button>} />}

        {data && data.products.length === 0 && (
          <div className="mk-empty">
            <h3>You don't own any systems yet</h3>
            <p>Browse the Marketplace for a ready-made system, or start the free Product Discovery to find a product of your own to build.</p>
            <div className="mk-row"><Link className="btn primary" to="/marketplace">Explore the Marketplace</Link><Link className="btn outline" to="/discover">Discover Your Product</Link></div>
          </div>
        )}

        {data && data.products.length > 0 && (
          <div className="mk-owned">
            {data.products.map((p) => {
              const pr = p.progress;
              const cont = pr.nextLessonId ? `/learn/${pr.nextLessonId}` : `/library/${p.key}`;
              return (
                <div key={p.key} className="mk-owned-card">
                  <div className="mk-owned-top">
                    <div>
                      <span className={`mk-chip mk-chip-${p.completed ? "owned" : "live"}`}>{p.completed ? "Completed" : pr.completed === 0 ? "Not started" : "In progress"}</span>
                      <h3><Link to={`/library/${p.key}`}>{p.title}</Link></h3>
                      <p className="mk-small">
                        {pr.currentModule ? <>Current: Module {pr.currentModule.position} · {pr.currentModule.title}</> : "All lessons complete"}
                        {" · "}{pr.modulesCompleted}/{pr.modules} modules
                      </p>
                    </div>
                    <div className="mk-pct">{pr.percent}%</div>
                  </div>
                  <ProgressBar percent={pr.percent} label={`${p.title} progress`} />
                  <div className="mk-row">
                    <Link className="btn primary" to={cont}>{pr.completed === 0 ? "Start →" : pr.nextLessonId ? "Continue →" : "Open →"}</Link>
                    <Link className="btn outline" to={`/library/${p.key}`}>Dashboard</Link>
                    <span className="mk-small">{p.os.built ? "✓ System built" : "System not built yet"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && data.locked.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="mk-h2">More systems</h2>
            <div className="mk-locked">
              {data.locked.map((p) => (
                <Link key={p.key} to={`/marketplace/${p.key}`} className="mk-locked-row">
                  <span aria-hidden>🔒</span>
                  <span className="mk-locked-title">{p.title}</span>
                  <span className={`mk-chip mk-chip-${statusLabel(p).tone}`}>{statusLabel(p).text}</span>
                  <span className="mk-link">View in Marketplace →</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
