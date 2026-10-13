import { useEffect, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { entitlementsService } from "@/services/entitlementsService";
import { resellerService, ResellerError } from "@/services/resellerService";
import { DMOS_MODULES } from "@/data/digitalMarketingOS";
import { cn } from "@/utils/cn";

/** Self-serve reseller link: owners generate their own Whop affiliate link for
 *  this product without leaving the dashboard. Whop does the actual tracking,
 *  attribution and payout — this just calls whop-affiliate to set it up. */
function ResellerCard() {
  const [state, setState] = useState<{ link: string; commissionPercent: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      setState(await resellerService.getOrCreateLink("digital-marketing-os"));
    } catch (e) {
      setError(e instanceof ResellerError ? e.message : "Couldn't generate your link. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!state) return;
    await navigator.clipboard.writeText(state.link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card style={{ marginBottom: "var(--space-4)" }}>
      <span className="eyebrow">Resell this</span>
      <h3 style={{ margin: "4px 0 0" }}>Become a reseller</h3>
      <p className="muted" style={{ marginTop: 6 }}>
        Share your own link and earn commission on every sale — tracked and paid out by Whop.
      </p>
      {state ? (
        <div style={{ marginTop: "var(--space-3)" }}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{state.link}</code>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={copy}>
            {copied ? "Copied!" : "Copy link"}
          </button>
          <p className="dim" style={{ fontSize: "0.8rem", marginTop: 10 }}>
            You earn {state.commissionPercent}% per sale through this link, paid out by Whop ~30 days after each sale.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: "var(--space-3)" }}>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate my reseller link"}
          </button>
          {error && <p className="d-notice" style={{ marginTop: 10 }}>{error}</p>}
        </div>
      )}
    </Card>
  );
}

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
          <ResellerCard />
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
