import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { discoveryService } from "@/services/discoveryService";
import type { Blueprint } from "@/types/schemas/blueprint";

export function BlueprintPage() {
  const location = useLocation();
  const passed = (location.state as { blueprint?: Blueprint; sessionId?: string } | null) ?? null;
  const [bp, setBp] = useState<Blueprint | null>(passed?.blueprint ?? null);
  const [loading, setLoading] = useState(!passed?.blueprint && Boolean(passed?.sessionId));

  useEffect(() => {
    if (bp || !passed?.sessionId) return;
    let active = true; setLoading(true);
    discoveryService.getBlueprintForSession(passed.sessionId)
      .then((b) => active && setBp(b))
      .catch(() => { /* empty state */ })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [bp, passed]);

  return (
    <Container>
      <Seo title="Your Digital Product Blueprint" description="The plan for your digital product — ready to build." />
      <div style={{ maxWidth: 820, margin: "var(--space-12) auto var(--space-24)" }}>
        <span className="eyebrow">Digital Product Blueprint</span>
        <h1>Your blueprint</h1>

        {loading && <LoadingState label="Loading your blueprint…" />}

        {!loading && !bp && (
          <EmptyState
            title="No blueprint yet"
            message="Choose an opportunity from your Discovery results to generate a blueprint. Nothing here is shown unless it was generated from your answers."
            action={<ButtonLink to="/discover" size="sm">Go to Discovery</ButtonLink>}
          />
        )}

        {!loading && bp && (
          <>
            <Section title="What this product is">
              <h3 style={{ margin: "0 0 4px" }}>{bp.product?.name}</h3>
              <p className="muted">{bp.product?.concept}</p>
              {bp.product?.corePromise && <p><strong>Core promise:</strong> {bp.product.corePromise}</p>}
              {bp.product?.format && <Meta label="Product format" value={bp.product.format} />}
            </Section>

            <Section title="Who it's for & the problem">
              <Meta label="Target customer" value={bp.buyer?.targetCustomer} />
              {bp.buyer?.customerProfile && <Meta label="Customer profile" value={bp.buyer.customerProfile} />}
              <Meta label="The problem" value={bp.buyer?.problem} />
              <Meta label="Desired outcome" value={bp.buyer?.desiredOutcome} />
            </Section>

            {bp.positioning && (
              <Section title="Positioning">
                <Meta label="Positioning" value={bp.positioning.mainPositioning} />
                <Meta label="Differentiation" value={bp.positioning.differentiation} />
                <Meta label="Key promise" value={bp.positioning.keyPromise} />
                <Meta label="Why this product" value={bp.positioning.whyThisProduct} />
              </Section>
            )}

            {bp.content && (bp.content.modules?.length || bp.content.deliverables?.length) && (
              <Section title="What's inside">
                {bp.content.modules?.map((m, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <strong>{m.title}</strong>{m.description && <> — <span className="muted">{m.description}</span></>}
                  </div>
                ))}
                {bp.content.deliverables?.length ? (
                  <p className="muted"><strong>Deliverables:</strong> {bp.content.deliverables.join(", ")}</p>
                ) : null}
              </Section>
            )}

            {bp.pricing && (
              <Section title="Pricing (a hypothesis)">
                {typeof bp.pricing.suggestedPrice === "number" && (
                  <Meta label="Suggested price" value={`${bp.pricing.currency ?? ""} ${bp.pricing.suggestedPrice}`.trim()} />
                )}
                {bp.pricing.priceHypothesis && <Meta label="Hypothesis" value={bp.pricing.priceHypothesis} />}
                <Meta label="Reasoning" value={bp.pricing.reasoning} />
                <p className="dim" style={{ fontSize: "0.8rem" }}>A starting hypothesis to test — not a guarantee.</p>
              </Section>
            )}

            {bp.marketing && (
              <Section title="Marketing direction">
                {bp.marketing.hooks?.length ? <Meta label="Hooks" value={bp.marketing.hooks.join(" · ")} /> : null}
                {bp.marketing.contentAngles?.length ? <Meta label="Content angles" value={bp.marketing.contentAngles.join(" · ")} /> : null}
                {bp.marketing.platforms?.length ? <Meta label="Platforms" value={bp.marketing.platforms.join(", ")} /> : null}
                {bp.marketing.conversionPath && <Meta label="Conversion path" value={bp.marketing.conversionPath} />}
              </Section>
            )}

            {bp.launch?.sequence?.length ? (
              <Section title="Launch direction">
                <ol className="launch-seq">
                  {bp.launch.sequence.map((s, i) => (
                    <li key={i}><strong>{s.step}</strong>{s.description && <> — <span className="muted">{s.description}</span></>}</li>
                  ))}
                </ol>
              </Section>
            ) : null}

            <Card style={{ marginTop: "var(--space-8)" }}>
              <span className="eyebrow">Next step</span>
              <h3 style={{ marginTop: 6 }}>Build it in the $47 Builder</h3>
              <p className="muted">{bp.nextStep ?? "The Builder takes this blueprint as its starting point and guides you through creating and launching the product — you won't repeat Discovery."}</p>
              <ButtonLink to="/builder">Continue to the Builder →</ButtonLink>
            </Card>
          </>
        )}
      </div>
    </Container>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginTop: "var(--space-4)" }}>
      <span className="eyebrow">{title}</span>
      <div style={{ marginTop: 8 }}>{children}</div>
    </Card>
  );
}
function Meta({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <p style={{ margin: "6px 0" }}><small className="meta-label">{label}</small><br />{value}</p>;
}
