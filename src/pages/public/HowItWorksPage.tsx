import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";

const STEPS: [string, string, string, string][] = [
  ["01", "Discover", "FREE", "Answer guided questions about your interests, skills, experience, ideas and market opportunities. No product idea required."],
  ["02", "Blueprint", "YOUR DIRECTION", "Receive a structured Digital Product Blueprint: potential products, best audience, the core problem, product format and a pricing direction."],
  ["03", "Build", "$47 ONE-TIME", "Move through a step-by-step Builder that turns your blueprint into a real product — offer, product creation, brand, landing page and launch."],
  ["04", "Launch", "EXECUTE", "Prepare your checkout, delivery and launch sequence, then take the product to market with a clear set of first actions."],
  ["05", "Sell", "GROW", "Plan the content, hooks, scripts and marketing that get attention, create demand and drive your first sales."],
  ["06", "Scale", "GROW", "Add products, refine your offers and grow what's working — up to 3 product businesses on your account."],
  ["07", "Automate", "PREMIUM · SOON", "Move toward a future AI Workforce where an AI CEO coordinates specialist AI employees around your business."],
];

export function HowItWorksPage() {
  return (
    <>
      <Seo title="How 369 Degrees works" description="Your journey from “I don't know what to sell” to a launched digital product — Discover, Blueprint, Build, Launch, Sell, Scale, Automate." />

      {/* Header */}
      <section className="hero" style={{ paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="eyebrow">HOW IT WORKS</div>
          <h1 style={{ maxWidth: 820 }}>From “I don't know what to sell” <em>to a product you can launch.</em></h1>
          <p className="lead">One clear path, one step at a time. Start free, get a blueprint, then build the business around it.</p>
          <div className="hero-ctas">
            <Link className="btn primary" to="/discover">Start Free Discovery →</Link>
            <Link className="btn outline" to="/builder">See the Builder</Link>
          </div>
        </div>
      </section>

      {/* Flow overview */}
      <section className="solution" style={{ paddingTop: 70 }}>
        <div className="container">
          <div className="flow">
            <div className="flow-step"><div className="n">01</div><strong>DISCOVER</strong></div><div className="arrow">→</div>
            <div className="flow-step"><div className="n">02</div><strong>CREATE</strong></div><div className="arrow">→</div>
            <div className="flow-step"><div className="n">03</div><strong>BUILD</strong></div><div className="arrow">→</div>
            <div className="flow-step"><div className="n">04</div><strong>LAUNCH</strong></div>
          </div>
          <div className="flow" style={{ marginTop: 10, gridTemplateColumns: "repeat(5,1fr)", maxWidth: 710, marginLeft: "auto", marginRight: "auto" }}>
            <div className="flow-step"><div className="n">05</div><strong>SELL</strong></div><div className="arrow">→</div>
            <div className="flow-step"><div className="n">06</div><strong>SCALE</strong></div><div className="arrow">→</div>
            <div className="flow-step"><div className="n">07</div><strong>AUTOMATE</strong></div>
          </div>
        </div>
      </section>

      {/* Step detail */}
      <section className="workflow">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">THE STEPS</div>
            <h2>What happens at each stage.</h2>
          </div>
          <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 14 }}>
            {STEPS.map(([num, title, tag, body]) => (
              <div key={num} className="journey-card" style={{ minHeight: 0, display: "grid", gridTemplateColumns: "70px 1fr", gap: 18, alignItems: "start" }}>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-.05em", color: "var(--blue)" }}>{num}</div>
                <div>
                  <div className="tag">{tag}</div>
                  <h3 style={{ margin: "6px 0 8px" }}>{title}</h3>
                  <p style={{ margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final">
        <div className="container">
          <div className="eyebrow">START HERE</div>
          <h2>It starts with discovering the right direction.</h2>
          <p>Find out what you could sell, who it could help and where to start — before you build anything.</p>
          <Link className="btn primary" to="/discover">Discover What You Could Sell — Free →</Link>
        </div>
      </section>
    </>
  );
}
