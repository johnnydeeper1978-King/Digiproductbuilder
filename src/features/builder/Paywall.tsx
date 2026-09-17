import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { paymentService } from "@/services/paymentService";
import { authService } from "@/services/authService";
import { isSupabaseConfigured } from "@/config/env";

/** The $47 Builder upgrade boundary. Honest value; no income guarantees. */
export function Paywall({ context }: { context?: "blueprint" | "direct" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    authService.getSession().then((s) => active && setAuthed(Boolean(s))).catch(() => active && setAuthed(false));
    return () => { active = false; };
  }, []);

  const buy = async () => {
    setError(null); setLoading(true);
    try {
      const res = await paymentService.startBuilderCheckout();
      if (res.alreadyOwned) { window.location.assign("/builder"); return; }
      if (res.url) { window.location.assign(res.url); return; }
      setError("Checkout could not be started.");
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout failed."); }
    finally { setLoading(false); }
  };

  return (
    <Card style={{ maxWidth: 640 }}>
      <span className="eyebrow">369 Digital Product Builder</span>
      <div className="row" style={{ alignItems: "baseline", gap: 10, marginTop: 6 }}>
        <h2 style={{ margin: 0 }}>$47</h2><span className="muted">one-time</span>
      </div>
      <p className="muted">
        {context === "blueprint"
          ? "Your blueprint is the plan. The Builder is where you build it — a guided, sequential path that turns the blueprint into a real, sellable product."
          : "A guided, AI-assisted build that takes you from idea to a launched digital product — one clear next action at a time."}
      </p>
      <ul className="check-list">
        <li>Takes your blueprint as the starting point — no repeating Discovery</li>
        <li>Guides product creation, positioning, pricing, landing page and launch</li>
        <li>Gives customized steps, prompts and recommended tools at each stage</li>
        <li>Up to 3 product projects on your account</li>
      </ul>
      <p className="dim" style={{ fontSize: "0.8rem" }}>
        No income or results are guaranteed — the Builder helps you create and launch; outcomes depend on your work and market.
      </p>

      {!isSupabaseConfigured && (
        <div className="d-notice">Payments aren't configured in this environment yet, so checkout can't run here.</div>
      )}

      {authed === false ? (
        <div className="row" style={{ marginTop: "var(--space-4)" }}>
          <ButtonLink to="/login">Sign in to continue</ButtonLink>
          <Link to="/discover" className="muted" style={{ alignSelf: "center" }}>or try free Discovery first</Link>
        </div>
      ) : (
        <div style={{ marginTop: "var(--space-4)" }}>
          <Button onClick={buy} disabled={loading || !isSupabaseConfigured}>
            {loading ? "Starting checkout…" : "Get the Builder — $47"}
          </Button>
          {error && <p className="d-field-error">{error}</p>}
        </div>
      )}
    </Card>
  );
}
