import { Seo } from "@/components/seo/Seo";
import { ButtonLink } from "@/components/ui/Button";

export function AiGuidePage() {
  return (
    <>
      <Seo title="AI Guide" />
      <div className="app-head"><div><span className="eyebrow">AI GUIDE</span><h1>Your AI guide</h1>
        <p>AI guidance runs through every step of 369 Degrees — here's where it helps.</p></div></div>

      <div className="app-grid grid-2">
        <div className="panel">
          <h3>In Discovery</h3>
          <p className="psub">The guide turns your answers into product opportunities.</p>
          <div className="feature-list">
            <div>Interprets your skills, interests and goals</div>
            <div>Suggests specific product directions</div>
            <div>Names the buyer, problem and outcome</div>
          </div>
          <ButtonLink to="/discover" size="sm">Open Discovery →</ButtonLink>
        </div>
        <div className="panel">
          <h3>In the Builder</h3>
          <p className="psub">The guide produces the output for each build phase.</p>
          <div className="feature-list">
            <div>Explains each step and why it matters</div>
            <div>Generates offers, positioning, landing copy and more</div>
            <div>Always gives you one clear next action</div>
          </div>
          <ButtonLink to="/builder" size="sm">Open the Builder →</ButtonLink>
        </div>
      </div>

      <div className="panel dash-next" style={{ marginTop: 16 }}>
        <span className="eyebrow">GET STARTED</span>
        <h3>Not sure where to begin?</h3>
        <p>Start with free Discovery — the guide takes it from there.</p>
        <ButtonLink to="/discover">Start Free Discovery →</ButtonLink>
      </div>
    </>
  );
}
