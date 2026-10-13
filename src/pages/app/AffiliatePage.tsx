import { Seo } from "@/components/seo/Seo";
import { Card } from "@/components/ui/Card";

const WHOP_AFFILIATE_URL = "https://whop.com/369-degrees-77fb/affiliates";

/** Affiliate program — /affiliate. Tracking, trackable links and payouts are
 *  handled entirely by Whop's native affiliate program (set per-product in
 *  the Whop dashboard); this page just sends people to sign up. */
export function AffiliatePage() {
  return (
    <>
      <Seo title="Affiliate Program" description="Earn commission promoting 369 Degrees products." />
      <div className="page-head">
        <span className="eyebrow">Grow</span>
        <h1>Affiliate Program</h1>
      </div>
      <Card style={{ maxWidth: 560 }}>
        <p className="muted">
          Promote Digital Marketing OS (and other 369 Degrees products as they go live) and earn
          commission on every sale you bring in. Sign-up, your trackable link, referral tracking
          and payouts are all handled by Whop — no separate account needed beyond your Whop login.
        </p>
        <div style={{ marginTop: "var(--space-4)" }}>
          <a className="btn btn-primary" href={WHOP_AFFILIATE_URL} target="_blank" rel="noopener noreferrer">
            Become an affiliate
          </a>
        </div>
        <p className="dim" style={{ fontSize: "0.8rem", marginTop: 10 }}>
          Commission is paid out by Whop roughly 30 days after each referred sale, per Whop's standard
          affiliate payout terms.
        </p>
      </Card>
    </>
  );
}
