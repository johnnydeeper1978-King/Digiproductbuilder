// Server-side entitlement checks. Access requires a paid purchases row
// (written only by the Whop webhook). Never trust the client for this.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ProductKey = "builder" | "digital-marketing-os";

export async function hasAccess(admin: SupabaseClient, uid: string, productKey: ProductKey): Promise<boolean> {
  const { data } = await admin.from("purchases")
    .select("id").eq("user_id", uid).eq("product_key", productKey).eq("status", "paid").maybeSingle();
  return Boolean(data);
}

/** Kept for existing call sites; equivalent to hasAccess(admin, uid, "builder"). */
export async function hasBuilderAccess(admin: SupabaseClient, uid: string): Promise<boolean> {
  return hasAccess(admin, uid, "builder");
}
