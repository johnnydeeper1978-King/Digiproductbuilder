// Server-side entitlement checks. Access to any paid product requires a 'paid'
// purchases row, which only the verified Whop webhook writes. Never trust the
// client for this.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function hasEntitlement(admin: SupabaseClient, uid: string, productKey: string): Promise<boolean> {
  const { data } = await admin.from("purchases")
    .select("id").eq("user_id", uid).eq("product_key", productKey).eq("status", "paid").limit(1);
  if (data && data.length > 0) return true;

  // Someone who paid through a plain Whop link before (or without) signing in
  // has an unclaimed purchase keyed by email. Only a CONFIRMED email may claim
  // it, otherwise anyone could register with a buyer's address.
  const { data: u } = await admin.auth.admin.getUserById(uid);
  const email = u?.user?.email?.toLowerCase();
  if (!email || !u?.user?.email_confirmed_at) return false;

  const { data: unclaimed } = await admin.from("purchases")
    .select("id").is("user_id", null).eq("product_key", productKey).eq("status", "paid")
    .eq("buyer_email", email).limit(1);
  if (!unclaimed || unclaimed.length === 0) return false;

  const { data: claimed } = await admin.from("purchases")
    .update({ user_id: uid }).eq("id", unclaimed[0].id).is("user_id", null).select("id");
  return Boolean(claimed && claimed.length > 0);
}

/** Claims every unclaimed paid purchase for this confirmed email; returns owned product keys. */
export async function ownedProductKeys(admin: SupabaseClient, uid: string): Promise<string[]> {
  const { data: u } = await admin.auth.admin.getUserById(uid);
  const email = u?.user?.email?.toLowerCase();
  if (email && u?.user?.email_confirmed_at) {
    const { data: unclaimed } = await admin.from("purchases")
      .select("id").is("user_id", null).eq("status", "paid").eq("buyer_email", email).limit(20);
    // Row by row: a duplicate of an already-owned product fails alone (unique index).
    for (const row of unclaimed ?? []) {
      await admin.from("purchases").update({ user_id: uid }).eq("id", row.id).is("user_id", null);
    }
  }
  const { data } = await admin.from("purchases")
    .select("product_key").eq("user_id", uid).eq("status", "paid");
  return [...new Set((data ?? []).map((r: { product_key: string }) => r.product_key))];
}

/** Back-compat for the deployed `builder` function. */
export function hasBuilderAccess(admin: SupabaseClient, uid: string): Promise<boolean> {
  return hasEntitlement(admin, uid, "builder");
}
