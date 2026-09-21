import { Seo } from "@/components/seo/Seo";
import { ButtonLink } from "@/components/ui/Button";

export function ContentPage() {
  return (
    <>
      <Seo title="Content" />
      <div className="app-head"><div><span className="eyebrow">CONTENT</span>
        <h1>Content studio <span className="soon">EVOLVING</span></h1>
        <p>Plan and create the marketing content that sells your product.</p></div></div>

      <div className="panel">
        <h3>Where content lives today</h3>
        <p className="psub">Your marketing plan and starter content are generated inside the Builder's Marketing &amp; Content phase — specific to your product and audience.</p>
        <div className="feature-list">
          <div>A practical marketing plan: what to post, why, where, when</div>
          <div>Hooks, short-form scripts, captions and post ideas</div>
          <div>CTA variations tied to your offer</div>
        </div>
        <ButtonLink to="/builder" size="sm">Open the Builder →</ButtonLink>
      </div>

      <div className="app-empty">
        <h3>A standalone content studio is coming</h3>
        <p>A dedicated space to generate, organise and schedule content across channels is on the roadmap. For now, content generation happens inside your product's build.</p>
      </div>
    </>
  );
}
