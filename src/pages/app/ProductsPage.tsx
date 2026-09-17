import { Seo } from "@/components/seo/Seo";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { MAX_PRODUCTS } from "@/types/product";

/**
 * Products list. Persistence (Supabase `products` table + RLS) lands in the
 * Phase 2 schema, so this shows an honest empty state rather than fake rows.
 */
export function ProductsPage() {
  return (
    <>
      <Seo title="My Products" />
      <div className="page-head">
        <span className="eyebrow">Build</span>
        <h1>My Products</h1>
        <p className="muted">You can create up to {MAX_PRODUCTS} products.</p>
      </div>
      <EmptyState
        title="No products yet"
        message="Once product persistence is enabled, your products (name, status, phase, progress) will appear here with resume, view, restart and archive."
        action={<ButtonLink to="/discover" size="sm">Start with Discovery</ButtonLink>}
      />
    </>
  );
}
