import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { env } from "@/config/env";

/** The $47 Builder upgrade boundary. Checkout is hosted on Whop; access is
 *  granted server-side once payment is confirmed (never by the browser). */
export function Paywall({ context }: { context?: "blueprint" | "direct" }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    authService.getSession().then((s) => {
      if (!active) return;
      setAuthed(Boolean(s));
      setEmail(s?.user?.email ?? null);
    }).catch(() => active && setAuthed(false));
    return () => { active = false; };
  }, []);

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

      {authed === false ? (
        <div className="row" style={{ marginTop: "var(--space-4)" }}>
          <ButtonLink to="/login">Sign in to continue</ButtonLink>
          <Link to="/discover" className="muted" style={{ alignSelf: "center" }}>or try free Discovery first</Link>
        </div>
      ) : (
        <div style={{ marginTop: "var(--space-4)" }}>
          <a className="btn btn-primary" href={env.whopBuilderUrl} target="_blank" rel="noopener noreferrer">
            Get the Builder — $47
          </a>
          <p className="dim" style={{ fontSize: "0.8rem", marginTop: 10 }}>
            Secure checkout is handled by Whop. Please pay with{email ? <> the same email you signed up with (<strong>{email}</strong>)</> : " the same email you signed up with"} so we can unlock your access. It activates shortly after payment — refresh this page.
          </p>
        </div>
      )}
    </Card>
  );
}
