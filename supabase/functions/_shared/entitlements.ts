// Server-side entitlement checks. Builder access requires a paid purchases row
// (written only by the Whop webhook). Never trust the client for this.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function hasBuilderAccess(admin: SupabaseClient, uid: string): Promise<boolean> {
  const { data } = await admin.from("purchases")
    .select("id").eq("user_id", uid).eq("product_key", "builder").eq("status", "paid").limit(1);
  if (data && data.length > 0) return true;

  // Someone who paid through a plain Whop link before (or without) signing in
  // has an unclaimed purchase keyed by email. Only a CONFIRMED email may claim
  // it, otherwise anyone could register with a buyer's address.
  const { data: u } = await admin.auth.admin.getUserById(uid);
  const email = u?.user?.email?.toLowerCase();
  if (!email || !u?.user?.email_confirmed_at) return false;

  const { data: unclaimed } = await admin.from("purchases")
    .select("id").is("user_id", null).eq("product_key", "builder").eq("status", "paid")
    .eq("buyer_email", email).limit(1);
  if (!unclaimed || unclaimed.length === 0) return false;

  const { data: claimed } = await admin.from("purchases")
    .update({ user_id: uid }).eq("id", unclaimed[0].id).is("user_id", null).select("id");
  return Boolean(claimed && claimed.length > 0);
}
