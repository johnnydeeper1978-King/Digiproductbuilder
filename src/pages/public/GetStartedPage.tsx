import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Paywall } from "@/features/builder/Paywall";

/**
 * Direct Builder path: Get Started -> $47 Builder purchase -> onboarding.
 * Discovery stays optional and is NOT duplicated here.
 */
export function GetStartedPage() {
  return (
    <Container>
      <Seo title="Get started" description="Start building your digital product with the $47 Builder, or try free Discovery first." />
      <div style={{ maxWidth: 760, margin: "var(--space-12) auto var(--space-24)" }}>
        <span className="eyebrow">Get started</span>
        <h1>Already know what you want to build?</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          Skip Discovery and go straight to the Builder. Prefer to find the right idea first?
          <> </><ButtonLink to="/discover" variant="ghost" size="sm">Try free Discovery →</ButtonLink>
        </p>
        <div style={{ marginTop: "var(--space-6)" }}><Paywall context="direct" /></div>
      </div>
    </Container>
  );
}
