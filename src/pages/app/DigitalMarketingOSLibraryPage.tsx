import { useEffect, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { entitlementsService } from "@/services/entitlementsService";
import { DMOS_MODULES } from "@/data/digitalMarketingOS";
import { cn } from "@/utils/cn";

/** Gated module viewer — /library/digital-marketing-os. Mirrors the Builder's
 *  access pattern: a paid purchases row (written only by the Whop webhook)
 *  is the only thing that unlocks this. */
export function DigitalMarketingOSLibraryPage() {
  const [access, setAccess] = useState<boolean | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    let alive = true;
    entitlementsService.hasDigitalMarketingOSAccess()
      .then((ok) => alive && setAccess(ok))
      .catch(() => alive && setAccess(false));
    return () => { alive = false; };
  }, []);

  if (access === null) return <LoadingState label="Checking your access…" />;

  if (!access) {
    return (
      <>
        <Seo title="Digital Marketing OS" />
        <div className="page-head"><span className="eyebrow">Library</span><h1>Digital Marketing OS</h1></div>
        <Card style={{ maxWidth: 520 }}>
          <p className="muted">You don't have access to this yet.</p>
          <div style={{ marginTop: "var(--space-4)" }}>
            <ButtonLink to="/marketplace/digital-marketing-os">View Digital Marketing OS →</ButtonLink>
          </div>
        </Card>
      </>
    );
  }

  const mod = DMOS_MODULES[active];

  return (
    <>
      <Seo title="Digital Marketing OS" />
      <div className="page-head"><span className="eyebrow">Library</span><h1>Digital Marketing OS</h1></div>
      <div className="builder-grid">
        <nav className="phase-rail">
          {DMOS_MODULES.map((m, i) => (
            <button key={m.id} className={cn("phase-item", active === i && "phase-item-active")} onClick={() => setActive(i)}>
              <span className="phase-dot">{m.number}</span>
              {m.title}
            </button>
          ))}
        </nav>
        <div>
          <Card>
            <span className="eyebrow">Module {mod.number}</span>
            <h2 style={{ margin: "4px 0 0" }}>{mod.title}</h2>
            <p className="muted" style={{ marginTop: 6 }}>{mod.outcome}</p>
          </Card>
          {mod.lessons.map((lesson, i) => {
            const isOpen = open.has(i);
            return (
              <Card key={lesson.title} style={{ marginTop: "var(--space-4)" }}>
                <button
                  className="row"
                  style={{ justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                  onClick={() => setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    return next;
                  })}
                >
                  <strong>{lesson.title}</strong>
                  <span className="dim">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p className="muted" style={{ marginTop: 10 }}>{lesson.body}</p>}
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
