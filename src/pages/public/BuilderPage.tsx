import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { LoadingState } from "@/components/feedback/LoadingState";
import { entitlementsService } from "@/services/entitlementsService";
import { Paywall } from "@/features/builder/Paywall";
import { BuilderWorkspace } from "@/features/builder/BuilderWorkspace";

/**
 * /builder — access is gated on VERIFIED payment (a paid purchases row written
 * by the Stripe webhook), read from the DB. A frontend redirect from checkout
 * never grants access on its own.
 */
export function BuilderPage() {
  const [params] = useSearchParams();
  const justCheckedOut = params.get("checkout") === "success";
  const [access, setAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    entitlementsService.hasBuilderAccess()
      .then((ok) => active && setAccess(ok))
      .catch(() => active && setAccess(false));
    return () => { active = false; };
  }, []);

  return (
    <Container>
      <Seo title="The $47 Builder" description="An AI-guided build that turns your blueprint into a launched digital product." />
      <div style={{ maxWidth: 760, margin: "var(--space-12) auto var(--space-24)" }}>
        {access === null && <LoadingState label="Checking your access…" />}
        {access === true && <BuilderWorkspace />}
        {access === false && (
          <>
            {justCheckedOut && (
              <div className="d-notice">
                Thanks! We're confirming your payment. Access unlocks automatically once Stripe confirms it —
                this can take a moment. You won't be charged twice.
              </div>
            )}
            <span className="eyebrow">The $47 Builder</span>
            <h1>Turn your blueprint into a product</h1>
            <p className="muted" style={{ maxWidth: 560 }}>
              The Builder is a guided, AI-assisted path from idea to launch. Get access below.
            </p>
            <div style={{ marginTop: "var(--space-6)" }}><Paywall context="blueprint" /></div>
          </>
        )}
      </div>
    </Container>
  );
}
