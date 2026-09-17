import { Seo } from "@/components/seo/Seo";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

const tiles = [
  { t: "What is this?", d: "Your home base — products, progress and the next action across 369 Degrees." },
  { t: "Why it matters", d: "Everything you build lives here, so you always know where you are." },
  { t: "What do I do next?", d: "Start Discovery or open the Builder to create your first product." },
];

export function DashboardPage() {
  return (
    <>
      <Seo title="Dashboard" />
      <div className="page-head">
        <span className="eyebrow">Overview</span>
        <h1>Dashboard</h1>
      </div>
      <div className="answer-triplet">
        {tiles.map((t) => (
          <Card key={t.t}><small style={{ color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.68rem" }}>{t.t}</small><p style={{ marginTop: 8, marginBottom: 0 }}>{t.d}</p></Card>
        ))}
      </div>
      <div className="row wrap" style={{ marginTop: "var(--space-8)" }}>
        <ButtonLink to="/discover">Start Discovery</ButtonLink>
        <ButtonLink to="/products" variant="secondary">My Products</ButtonLink>
      </div>
    </>
  );
}
