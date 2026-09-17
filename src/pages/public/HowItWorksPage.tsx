import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

const steps = [
  { t: "Free Discovery", d: "A guided flow learns your skills, interests, time and goals, then generates product opportunities scored for fit — including unexpected ones." },
  { t: "Your Blueprint", d: "Pick an opportunity and get a Digital Product Blueprint: buyer, problem, positioning, content outline, pricing hypothesis and a launch direction." },
  { t: "The $47 Builder", d: "The Builder uses your blueprint as its starting point and guides you through creating, positioning, pricing and launching the product." },
  { t: "Launch & sell", d: "Landing page, payment setup, content and a launch sequence — always with a clear next action." },
  { t: "Automate", d: "As you grow, an AI workforce can take on research, content, marketing and support." },
];

export function HowItWorksPage() {
  return (
    <Container>
      <Seo title="How it works" description="From free Discovery to a blueprint to a guided $47 build — here's the full 369 Degrees journey." />
      <div className="page-head" style={{ paddingTop: "var(--space-12)" }}>
        <span className="eyebrow">How it works</span>
        <h1>From "no idea" to a product you can sell</h1>
        <p className="muted" style={{ maxWidth: 620 }}>Five stages. Each one ends knowing exactly what to do next.</p>
      </div>
      <div className="stack">
        {steps.map((s, i) => (
          <Card key={s.t}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="step-num">{i + 1}</span>
              <div>
                <h3 style={{ marginBottom: 6 }}>{s.t}</h3>
                <p className="muted" style={{ margin: 0 }}>{s.d}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="row" style={{ marginTop: "var(--space-8)" }}>
        <ButtonLink to="/discover">Start free Discovery</ButtonLink>
        <ButtonLink to="/builder" variant="secondary">Skip to the Builder</ButtonLink>
      </div>
    </Container>
  );
}
