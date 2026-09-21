import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { isSupabaseConfigured } from "@/config/env";
import { productsService } from "@/services/productsService";
import type { Product } from "@/types/product";

export function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured || !productId) { if (active) setLoading(false); return; }
      try { const p = await productsService.getById(productId); if (active) setProduct(p); }
      catch { /* empty */ } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [productId]);

  if (loading) return <LoadingState label="Loading product…" />;
  if (!product) return (
    <div className="app-empty"><h3>Product not found</h3>
      <p>This product may not exist or may belong to another account.</p>
      <ButtonLink to="/products" size="sm">Back to library</ButtonLink></div>
  );

  return (
    <>
      <Seo title={product.name} />
      <div className="app-head">
        <div><span className="eyebrow">PRODUCT</span><h1>{product.name}</h1>
          <p>Phase: {product.current_phase} · {product.progress}% complete</p></div>
        <span className={`pstatus ${product.status}`}>{product.status}</span>
      </div>
      <div className="panel">
        <h3>Progress</h3>
        <div className="pbar" style={{ margin: "12px 0 0" }}><i style={{ width: `${product.progress}%` }} /></div>
      </div>
      <div className="panel dash-next">
        <span className="eyebrow">CONTINUE</span>
        <h3>Keep building this product</h3>
        <p>Pick up in the Builder and move to the next phase.</p>
        <ButtonLink to="/builder">Open the Builder →</ButtonLink>
      </div>
    </>
  );
}
