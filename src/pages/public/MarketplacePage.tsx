import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DMOS_PRODUCT, DMOS_MODULES } from "@/data/digitalMarketingOS";

export function MarketplacePage() {
  return (
    <Container>
      <Seo
        title="Marketplace"
        description="Discover and buy digital products from 369 Degrees and its creators."
      />
      <div className="page-head" style={{ paddingTop: "var(--space-12)" }}>
        <span className="eyebrow">369 Degrees</span>
        <h1>Marketplace</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          Products from 369 Degrees, built on the same operating system the Builder teaches.
        </p>
      </div>

      <div className="marketplace-grid" style={{ marginTop: "var(--space-8)" }}>
        <Link to={`/marketplace/${DMOS_PRODUCT.key}`} style={{ textDecoration: "none", color: "inherit" }}>
          <Card hover>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="eyebrow">Marketing</span>
            </div>
            <h2 style={{ margin: "var(--space-2) 0 0" }}>{DMOS_PRODUCT.name}</h2>
            <p className="dim" style={{ fontSize: "0.85rem", marginTop: 4 }}>{DMOS_PRODUCT.moduleCount} modules</p>
            <p className="muted" style={{ marginTop: "var(--space-4)" }}>{DMOS_PRODUCT.tagline}</p>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginTop: "var(--space-6)" }}>
              <div className="row" style={{ gap: 8, alignItems: "baseline" }}>
                <strong style={{ fontSize: "1.3rem" }}>${DMOS_PRODUCT.price}</strong>
                <span className="dim" style={{ textDecoration: "line-through" }}>${DMOS_PRODUCT.compareAtPrice}</span>
              </div>
              <span className="muted">Learn more →</span>
            </div>
          </Card>
        </Link>

        <Card style={{ opacity: 0.7 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="eyebrow">Build</span>
            <Badge tone="soon">Coming soon</Badge>
          </div>
          <h2 style={{ margin: "var(--space-2) 0 0" }}>369 Digital Product Builder</h2>
          <p className="muted" style={{ marginTop: "var(--space-4)" }}>
            Already live at <Link to="/builder">/builder</Link> — a dedicated Marketplace listing for it lands here next.
          </p>
        </Card>
      </div>
    </Container>
  );
}

// Re-exported for anything that wants the module count without importing the data file directly.
export { DMOS_MODULES };
