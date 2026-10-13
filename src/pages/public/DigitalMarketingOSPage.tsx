import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { env } from "@/config/env";
import { DMOS_PRODUCT, DMOS_MODULES } from "@/data/digitalMarketingOS";

/** Public sales page for Digital Marketing OS — /marketplace/digital-marketing-os. */
export function DigitalMarketingOSPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const checkoutReady = Boolean(env.whopDmosUrl);

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
    <Container>
      <Seo title={DMOS_PRODUCT.name} description={DMOS_PRODUCT.tagline} />
      <div style={{ maxWidth: 880, margin: "0 auto", paddingTop: "var(--space-12)", paddingBottom: "var(--space-24)" }}>
        <span className="eyebrow">Marketing</span>
        <h1>{DMOS_PRODUCT.name}</h1>
        <p className="muted" style={{ maxWidth: 620, fontSize: "1.05rem" }}>{DMOS_PRODUCT.tagline}</p>

        <Card style={{ maxWidth: 480, marginTop: "var(--space-6)" }}>
          <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
            <h2 style={{ margin: 0 }}>${DMOS_PRODUCT.price}</h2>
            <span className="dim" style={{ textDecoration: "line-through" }}>${DMOS_PRODUCT.compareAtPrice}</span>
            <span className="muted">one-time</span>
          </div>
          <ul className="check-list" style={{ marginTop: "var(--space-4)" }}>
            <li>{DMOS_PRODUCT.moduleCount} modules — strategy, platforms, content, funnels and measurement</li>
            <li>Built from the same operating system behind the $97 Builder</li>
            <li>Every claim sourced, every stale-prone fact flagged "verify before publishing"</li>
          </ul>

          {!checkoutReady ? (
            <p className="d-notice" style={{ marginTop: "var(--space-4)" }}>
              Checkout isn't live yet — the Whop product for Digital Marketing OS hasn't been set up.
            </p>
          ) : authed === false ? (
            <div className="row" style={{ marginTop: "var(--space-4)" }}>
              <ButtonLink to="/login">Sign in to continue</ButtonLink>
            </div>
          ) : (
            <div style={{ marginTop: "var(--space-4)" }}>
              <a className="btn btn-primary" href={env.whopDmosUrl} target="_blank" rel="noopener noreferrer">
                Get Digital Marketing OS — ${DMOS_PRODUCT.price}
              </a>
              <p className="dim" style={{ fontSize: "0.8rem", marginTop: 10 }}>
                Secure checkout is handled by Whop. Please pay with{email ? <> the same email you signed up with (<strong>{email}</strong>)</> : " the same email you signed up with"} so we can unlock your access.
              </p>
            </div>
          )}
        </Card>

        <h2 style={{ marginTop: "var(--space-16)" }}>What's inside</h2>
        <div className="row" style={{ flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          {DMOS_MODULES.map((m) => (
            <Card key={m.id}>
              <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
                <span className="dim">Module {m.number}</span>
                <strong>{m.title}</strong>
              </div>
              <p className="muted" style={{ marginTop: 6 }}>{m.outcome}</p>
            </Card>
          ))}
        </div>

        <p className="dim" style={{ fontSize: "0.85rem", marginTop: "var(--space-8)" }}>
          No income or results are guaranteed — this is a system to run, not a promise of outcome.
          Already own it? <Link to="/library/digital-marketing-os">Go to your modules →</Link>
        </p>
      </div>
    </Container>
  );
}
