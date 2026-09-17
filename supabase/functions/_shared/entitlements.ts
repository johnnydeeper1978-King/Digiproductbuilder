// Server-side entitlement checks. Builder access requires a paid purchases row
// (written only by the Stripe webhook). Never trust the client for this.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function hasBuilderAccess(admin: SupabaseClient, uid: string): Promise<boolean> {
  const { data } = await admin.from("purchases")
    .select("id").eq("user_id", uid).eq("product_key", "builder").eq("status", "paid").maybeSingle();
  return Boolean(data);
}
