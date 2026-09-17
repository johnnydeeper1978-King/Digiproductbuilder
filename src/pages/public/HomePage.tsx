import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const journey = [
  { n: "1", t: "Discover", d: "Answer a guided flow. We surface product opportunities that fit you." },
  { n: "2", t: "Blueprint", d: "Turn the best opportunity into a concrete digital product blueprint." },
  { n: "3", t: "Build", d: "The $47 Builder guides you from blueprint to a product you can sell." },
  { n: "4", t: "Launch & sell", d: "Positioning, landing page, payments, content and a launch plan." },
  { n: "5", t: "Automate", d: "Grow into an AI workforce that runs the busywork for you." },
];

const entries = [
  { to: "/discover", label: "Start free Discovery", tone: "accent" as const, desc: "Not sure what to sell? Begin here — free, ends with a blueprint." },
  { to: "/builder", label: "Go straight to the Builder", tone: undefined, desc: "Already know your product? Skip Discovery and start building." },
  { to: "/marketplace", label: "Browse the Marketplace", tone: undefined, desc: "Discover and buy digital products from creators." },
  { to: "/workforce", label: "Explore the AI Workforce", tone: "soon" as const, desc: "A team of AI specialists to run your product business." },
];

export function HomePage() {
  return (
    <>
      <Seo
        title="Discover, build and sell your digital product"
        description="369 Degrees helps you discover a digital product opportunity, turn it into a blueprint, and build and sell it — even starting from zero."
      />
      <section className="hero">
        <Container>
          <div className="hero-grid">
            <div>
              <span className="eyebrow">Digital product business, guided end-to-end</span>
              <h1 style={{ marginTop: "var(--space-4)" }}>
                Finally know <span className="gradient-text">what to sell</span> — and exactly what to do next.
              </h1>
              <p style={{ fontSize: "1.1rem", maxWidth: 520 }}>
                369 Degrees takes you from "I want to sell something online but don't know what"
                to a specific product opportunity, a blueprint, and a guided build.
              </p>
              <div className="row wrap" style={{ marginTop: "var(--space-6)" }}>
                <ButtonLink to="/discover">Start free Discovery</ButtonLink>
                <ButtonLink to="/builder" variant="secondary">Enter the Builder</ButtonLink>
              </div>
              <div className="pill-row">
                <Badge tone="accent">Free Discovery</Badge>
                <Badge>$47 Builder</Badge>
                <Badge tone="soon">AI Workforce · soon</Badge>
              </div>
            </div>
            <Card>
              <span className="eyebrow">The journey</span>
              <div className="stack" style={{ marginTop: "var(--space-4)" }}>
                {journey.map((s) => (
                  <div key={s.n} className="row" style={{ alignItems: "flex-start" }}>
                    <span className="step-num">{s.n}</span>
                    <div>
                      <strong>{s.t}</strong>
                      <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.92rem" }}>{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <h2>Choose your way in</h2>
          <p className="muted" style={{ maxWidth: 560 }}>Every path leads to a product you can sell. Start wherever you are.</p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: "var(--space-6)" }}>
            {entries.map((e) => (
              <Card key={e.to} hover>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
                  <strong style={{ fontFamily: "var(--font-display)" }}>{e.label}</strong>
                  {e.tone && <Badge tone={e.tone}>{e.tone === "soon" ? "Soon" : "Free"}</Badge>}
                </div>
                <p className="muted" style={{ fontSize: "0.92rem" }}>{e.desc}</p>
                <ButtonLink to={e.to} variant="ghost" size="sm">Continue →</ButtonLink>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
