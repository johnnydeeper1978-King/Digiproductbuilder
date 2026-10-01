import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService, formatPrice, AccessError } from "@/services/catalogService";
import { MkState, ProgressBar, WaitlistForm, statusLabel } from "@/features/catalog/components";
import { loginPath, useSession } from "@/features/catalog/useSession";
import type { ProductDetail } from "@/features/catalog/types";

export const DISCLAIMERS: Record<string, string> = {
  "adhd-system": "This is a productivity and organisation product. It is not medical treatment, diagnosis, therapy or a substitute for professional care.",
  "budgeting-system": "General budgeting and financial-organisation education only. It is not individual investment, tax, legal, credit or financial-planning advice, and it doesn't promise financial outcomes. Check country-specific rules with an official or qualified source.",
};

const KIND_LABEL: Record<string, string> = {
  worksheet: "worksheets", template: "templates", tracker: "trackers", checklist: "checklists", tool: "tools",
};

export function ProductPage() {
  const { key = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    if (session === undefined) return;
    let active = true;
    setError(null);
    catalogService.product(key).then((d) => active && setData(d))
      .catch((e) => active && setError(e instanceof AccessError && e.code === "not_found" ? "not_found" : (e as Error).message));
    return () => { active = false; };
  }, [key, session]);

  const buy = async () => {
    setBuyError(null);
    if (!session) { navigate(loginPath(`/marketplace/${key}?buy=1`)); return; }
    setBuying(true);
    try {
      const r = await catalogService.checkout(key);
      if (r.alreadyOwned) { navigate(`/library/${key}`); return; }
      if (r.url) { window.location.assign(r.url); return; }
      setBuyError("Checkout didn't start. Please try again.");
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Checkout didn't start.");
    } finally { setBuying(false); }
  };

  // Returning from sign-in with intent to buy.
  useEffect(() => {
    if (params.get("buy") === "1" && session && data?.product.purchasable && !data.owned && !buying) void buy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, session, data]);

  if (error === "not_found") return <div className="container mk-pad"><MkState title="We couldn't find that product" action={<Link className="btn primary" to="/marketplace">Back to the Marketplace</Link>} /></div>;
  if (error) return <div className="container mk-pad"><MkState title="This page didn't load" message={error} action={<button className="btn outline" onClick={() => window.location.reload()}>Try again</button>} /></div>;
  if (!data) return <div className="container mk-pad"><MkState loading title="Loading…" /></div>;

  const { product: p, modules, owned, progress } = data;
  const s = statusLabel({ ...p, owned });
  const price = formatPrice(p.price_cents, p.currency);
  const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);
  const preview = modules.flatMap((m) => m.lessons).find((l) => l.is_preview);
  const resourceSummary = Object.entries(data.resourceCounts).map(([k, n]) => `${n} ${KIND_LABEL[k] ?? k}`).join(" · ");

  const Cta = () => (
    <div className="mk-cta">
      {owned ? (
        <>
          {progress && <><ProgressBar percent={progress.percent} /><p className="mk-small">{progress.percent}% complete</p></>}
          <Link className="btn primary mk-wide" to={`/library/${p.key}`}>Open in your library →</Link>
        </>
      ) : p.status === "live" && p.purchasable ? (
        <>
          <div className="mk-price-lg">{price}<small> one-time</small></div>
          <button className="btn primary mk-wide" onClick={buy} disabled={buying}>{buying ? "Opening secure checkout…" : `Get instant access — ${price}`}</button>
          <p className="mk-small">Secure checkout by Whop. Access opens in your 369 Degrees library as soon as payment is confirmed.</p>
          {buyError && <p className="mk-err">{buyError}</p>}
        </>
      ) : p.status === "live" ? (
        <>
          {price && <div className="mk-price-lg">{price}<small> one-time</small></div>}
          <p className="mk-small"><b>Checkout opens shortly.</b> Leave your email and we'll send you the link the moment it's live.</p>
          <WaitlistForm productKey={p.key} cta="Email me the link" />
        </>
      ) : (
        <>
          <p className="mk-small"><b>Coming soon.</b> Join the list and we'll email you when it opens.</p>
          <WaitlistForm productKey={p.key} cta="Join the list" />
        </>
      )}
      {preview && !owned && <Link className="mk-preview-link" to={`/learn/${preview.id}`}>Try the first lesson free →</Link>}
    </div>
  );

  return (
    <>
      <Seo title={p.title} description={p.tagline ?? undefined} />
      <section className="mk-phero">
        <div className="container mk-phero-grid">
          <div>
            <Link className="mk-back" to="/marketplace">← Marketplace</Link>
            <div className="mk-meta-row">
              <span className={`mk-chip mk-chip-${s.tone}`}>{s.text}</span>
              {p.category && <span className="mk-cat">{p.category}</span>}
            </div>
            <h1>{p.title}</h1>
            {p.tagline && <p className="lead">{p.tagline}</p>}
            {lessonCount > 0 && (
              <div className="mk-facts">
                <div><b>{modules.length}</b><span>modules</span></div>
                <div><b>{lessonCount}</b><span>guided lessons</span></div>
                {data.resourceTitles.length > 0 && <div><b>{data.resourceTitles.length}</b><span>interactive tools</span></div>}
              </div>
            )}
          </div>
          <Cta />
        </div>
      </section>

      <section className="mk-section">
        <div className="container mk-detail">
          {p.description && (
            <div className="mk-block">
              <h2>What this is</h2>
              <p>{p.description}</p>
            </div>
          )}

          {(p.who_for.length > 0 || p.outcomes.length > 0) && (
            <div className="mk-two">
              {p.who_for.length > 0 && (
                <div className="mk-block mk-soft">
                  <h3>It's for you if…</h3>
                  <ul className="mk-ticks">{p.who_for.map((w) => <li key={w}>{w}</li>)}</ul>
                </div>
              )}
              {p.outcomes.length > 0 && (
                <div className="mk-block mk-soft">
                  <h3>What you'll have when you're done</h3>
                  <ul className="mk-ticks">{p.outcomes.map((w) => <li key={w}>{w}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {lessonCount > 0 && (
            <div className="mk-block">
              <h2>How it works</h2>
              <div className="mk-steps">
                {["Learn", "See it", "Try it", "Use it", "Test yourself", "Complete"].map((t, i) => <div key={t}><span>{i + 1}</span>{t}</div>)}
              </div>
              <p className="mk-muted">Every lesson follows the same rhythm, and every module produces something you keep — so by the end you've built a working system, not just read about one.</p>
            </div>
          )}

          {modules.length > 0 && (
            <div className="mk-block">
              <h2>Inside the system</h2>
              <div className="mk-modules">
                {modules.map((m) => (
                  <details key={m.id} className="mk-module" open={m.position === 1}>
                    <summary>
                      <span className="mk-mnum">{String(m.position).padStart(2, "0")}</span>
                      <span className="mk-mtitle">{m.title}{m.outcome && <small>You'll produce: {m.outcome}</small>}</span>
                      <span className="mk-mcount">{m.lessons.length} lessons</span>
                    </summary>
                    {m.summary && <p className="mk-muted">{m.summary}</p>}
                    <ol>
                      {m.lessons.map((l) => (
                        <li key={l.id}>
                          {l.is_preview && !owned ? <Link to={`/learn/${l.id}`}>{l.title}</Link> : <span>{l.title}</span>}
                          {l.is_preview && !owned && <span className="mk-free">Free preview</span>}
                          {l.est_minutes ? <span className="mk-min">{l.est_minutes} min</span> : null}
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            </div>
          )}

          {data.resourceTitles.length > 0 && (
            <div className="mk-block">
              <h2>Your resource vault</h2>
              <p className="mk-muted">{resourceSummary}. Fill them in right inside the lessons, save your answers, and download any of them as a spreadsheet-ready CSV.</p>
              <div className="mk-tags">{data.resourceTitles.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          )}

          <div className="mk-block mk-faq">
            <h2>Good to know</h2>
            <details><summary>How do I access it?</summary><p>After payment you sign in to your free 369 Degrees account and the system appears in your library. Everything works in the browser on phone, tablet or computer, and your progress and answers are saved to your account.</p></details>
            <details><summary>Can I download it?</summary><p>The lessons live in your account. Your own worksheets and trackers can be downloaded as CSV files you can open in Excel or Google Sheets.</p></details>
            <details><summary>What if I bought with a different email?</summary><p>Sign in with the same email address you used at checkout and the purchase is linked to your account automatically once your email is confirmed.</p></details>
            <details><summary>Refunds</summary><p>Because access to the digital content is given straight away, purchases are final, as set out in our <Link to="/terms">Terms</Link>. If something isn't working, <Link to="/contact">contact us</Link> and we'll help.</p></details>
          </div>

          {DISCLAIMERS[p.key] && <p className="mk-disclaimer">{DISCLAIMERS[p.key]}</p>}

          <div className="mk-bottom-cta">
            <div>
              <h3>{owned ? "Pick up where you left off." : p.status === "live" ? "Ready to build your system?" : "Want to know when it opens?"}</h3>
            </div>
            <Cta />
          </div>

          <div className="mk-cross-inline">
            <span>Want to create and sell your own digital product?</span>
            <Link to="/discover">Start the free Product Discovery →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
