import { useEffect, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { productsService } from "@/services/productsService";
import { MAX_PRODUCTS, type Product } from "@/types/product";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured) { if (active) setLoading(false); return; }
      try {
        const s = await authService.getSession();
        if (s?.user?.id) { const list = await productsService.listForUser(s.user.id); if (active) setProducts(list); }
      } catch { /* empty */ } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const activeCount = products.filter((p) => p.status !== "archived").length;

  return (
    <>
      <Seo title="Product Library" />
      <div className="app-head">
        <div><span className="eyebrow">OVERVIEW</span><h1>Product Library</h1>
          <p>Your digital product projects — up to {MAX_PRODUCTS} active at a time.</p></div>
        {activeCount < MAX_PRODUCTS && <ButtonLink to="/discover" size="sm">Start a new product</ButtonLink>}
      </div>

      {loading ? <LoadingState label="Loading your products…" /> : products.length === 0 ? (
        <div className="app-empty">
          <h3>No products yet</h3>
          <p>Run free Discovery to generate your first product opportunity and blueprint, then build it in the Builder.</p>
          <ButtonLink to="/discover" size="sm">Start with Discovery →</ButtonLink>
        </div>
      ) : (
        <div className="app-grid grid-3">
          {products.map((p) => (
            <div key={p.id} className="prod-card">
              <div className="ptop"><h3>{p.name}</h3><span className={`pstatus ${p.status}`}>{p.status}</span></div>
              <div className="pphase">Phase: {p.current_phase}</div>
              <div className="pbar"><i style={{ width: `${p.progress}%` }} /></div>
              <div className="pacts">
                <ButtonLink to={`/products/${p.id}`} variant="secondary" size="sm">View</ButtonLink>
                <ButtonLink to="/builder" size="sm">Open Builder</ButtonLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
