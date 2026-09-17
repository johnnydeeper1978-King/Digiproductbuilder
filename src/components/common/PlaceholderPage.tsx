import type { ReactNode } from "react";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

/**
 * Deliberate placeholder for routes whose functionality is not built yet.
 * It is honest by design: it states what the screen is, why it matters, and
 * what comes next — and clearly marks the feature as not-yet-available. It
 * never simulates functionality.
 */
export function PlaceholderPage({
  title, seoDescription, what, why, next, status = "Foundation",
}: {
  title: string;
  seoDescription?: string;
  what: string;
  why: string;
  next: string;
  status?: "Foundation" | "Coming soon";
  children?: ReactNode;
}) {
  return (
    <Container>
      <Seo title={title} description={seoDescription ?? what} />
      <div className="page-head" style={{ paddingTop: "var(--space-12)" }}>
        <div className="row" style={{ marginBottom: "var(--space-4)" }}>
          <span className="eyebrow">369 Degrees</span>
          <Badge tone="soon">{status}</Badge>
        </div>
        <h1>{title}</h1>
      </div>
      <div className="answer-triplet">
        <div className="card"><small>What is this?</small><p style={{ marginTop: 8 }}>{what}</p></div>
        <div className="card"><small>Why it matters</small><p style={{ marginTop: 8 }}>{why}</p></div>
        <div className="card"><small>What's next</small><p style={{ marginTop: 8 }}>{next}</p></div>
      </div>
    </Container>
  );
}
