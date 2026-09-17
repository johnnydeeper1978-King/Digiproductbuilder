/**
 * Products data boundary.
 *
 * Defines the real Supabase-backed contract for the (max 3) products per
 * user. The `products` table is NOT created in this foundation phase, so
 * these methods will error until the Phase 2 schema + RLS exist. We do NOT
 * fake persistence: pages render empty/placeholder states instead of calling
 * these with fabricated data.
 */
import { requireSupabase } from "@/lib/supabase/client";
import { MAX_PRODUCTS, type Product } from "@/types/product";

const TABLE = "products";

export const productsService = {
  MAX_PRODUCTS,

  async listForUser(userId: string): Promise<Product[]> {
    const { data, error } = await requireSupabase()
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Product[];
  },

  async getById(productId: string): Promise<Product | null> {
    const { data, error } = await requireSupabase()
      .from(TABLE)
      .select("*")
      .eq("id", productId)
      .maybeSingle();
    if (error) throw error;
    return (data as Product) ?? null;
  },
};
