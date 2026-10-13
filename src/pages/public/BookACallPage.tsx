import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";

const CALENDLY_URL = "https://calendly.com/johnnydeeper1978/30min";

export function BookACallPage() {
  return (
    <Container>
      <Seo
        title="Book a Call"
        description="Talk to the 369 Degrees team about coaching and done-with-you help."
      />
      <div className="page-head" style={{ paddingTop: "var(--space-12)" }}>
        <span className="eyebrow">369 Degrees</span>
        <h1>Book a call</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          A 30-minute call to talk through coaching or done-with-you support — some people move
          faster with a human, this is that path.
        </p>
        <a className="btn btn-primary" href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
          style={{ marginTop: "var(--space-6)", display: "inline-block" }}>
          Pick a time
        </a>
      </div>
    </Container>
  );
}
