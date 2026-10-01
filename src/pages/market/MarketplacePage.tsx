import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService } from "@/services/catalogService";
import { MkState, ProductCard } from "@/features/catalog/components";
import type { CatalogProduct } from "@/features/catalog/types";

export function MarketplacePage() {
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    catalogService.catalog().then((p) => active && setProducts(p))
      .catch((e) => active && setError(e instanceof Error ? e.message : "Couldn't load the marketplace."));
    return () => { active = false; };
  }, []);

  const available = (products ?? []).filter((p) => p.status === "live");
  const upcoming = (products ?? []).filter((p) => p.status !== "live");

  return (
    <>
      <Seo title="Marketplace — practical digital systems" description="A curated library of practical digital systems: guided modules, interactive tools and a finished system you keep using." />
      <section className="mk-hero">
        <div className="container">
          <div className="eyebrow">THE 369 MARKETPLACE</div>
          <h1>Ready-made systems you <em>actually use</em>.</h1>
          <p className="lead">Not PDFs. Each system walks you through short guided modules, gives you interactive worksheets and trackers, saves your progress, and ends with a finished system built around your life or business.</p>
          <div className="mk-how">
            <div><b>Learn</b><span>Short, practical lessons</span></div>
            <div><b>Try it</b><span>Interactive tools inside each lesson</span></div>
            <div><b>Build</b><span>Every module produces something real</span></div>
            <div><b>Keep</b><span>Finish with your own working system</span></div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="container">
          {!products && !error && <MkState loading title="Loading the library…" />}
          {error && <MkState title="The marketplace didn't load" message={error} action={<button className="btn outline" onClick={() => window.location.reload()}>Try again</button>} />}

          {available.length > 0 && (
            <>
              <div className="mk-section-head"><h2>Available now</h2><p>Open instantly in your 369 Degrees library after purchase.</p></div>
              <div className="mk-grid">{available.map((p) => <ProductCard key={p.key} p={p} />)}</div>
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <div className="mk-section-head" style={{ marginTop: 56 }}><h2>Coming soon</h2><p>In production now. Join the list on any product page and we'll tell you when it opens.</p></div>
              <div className="mk-grid">{upcoming.map((p) => <ProductCard key={p.key} p={p} />)}</div>
            </>
          )}
        </div>
      </section>

      <section className="mk-section mk-cross">
        <div className="container mk-cross-inner">
          <div>
            <div className="eyebrow">PREFER TO CREATE YOUR OWN?</div>
            <h2>Not sure what to build? Find your own product idea — free.</h2>
            <p>Answer a guided interview about your skills, interests and the people you can help. You'll get personalised product opportunities and a free Product Guide.</p>
          </div>
          <Link className="btn primary" to="/discover">Discover Your Product →</Link>
        </div>
      </section>
    </>
  );
}
