import { Seo } from "@/components/seo/Seo";
import { ButtonLink } from "@/components/ui/Button";

export function AffiliatePage() {
  return (
    <>
      <Seo title="Affiliate Program" />
      <div className="app-head"><div><span className="eyebrow">EARN</span>
        <h1>Affiliate program <span className="soon">COMING SOON</span></h1>
        <p>Learn. Build. Sell. Refer. Earn — across the 369 Degrees ecosystem.</p></div></div>

      <div className="app-grid grid-3">
        <div className="panel"><h3>Promote 369 Degrees</h3><p className="psub">Refer eligible 369 Degrees offers and earn on qualifying sales.</p></div>
        <div className="panel"><h3>Promote Marketplace products</h3><p className="psub">Earn commissions promoting eligible products created by Marketplace sellers.</p></div>
        <div className="panel"><h3>Refer recommended tools</h3><p className="psub">Potentially earn from selected recommended tools and platforms.</p></div>
      </div>

      <div className="app-empty">
        <h3>The affiliate program is being set up</h3>
        <p>Tracking, payouts and eligible offers are being finalised. In the meantime, the best way to prepare is to build and launch your own product.</p>
        <ButtonLink to="/builder" size="sm">Build your product →</ButtonLink>
      </div>
    </>
  );
}
