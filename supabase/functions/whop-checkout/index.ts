// Edge Function: `whop-checkout`
// A signed-in user starts the $47 Builder purchase. Creates a PENDING purchases
// row and a Whop checkout whose metadata carries the user + purchase ids, then
// returns the checkout URL. Access is NOT granted here — only the verified
// webhook marks a purchase 'paid'.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { createBuilderCheckout, WhopNotConfiguredError } from "../_shared/whop.ts";

function safeRedirect(appUrl: string | null): string | undefined {
  if (!appUrl) return undefined;
  try {
    const u = new URL(appUrl);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return undefined;
    return `${u.origin}/builder?checkout=success`;
  } catch { return undefined; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const uid = await getCallerUid(req.headers.get("Authorization"));
  if (!uid) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional body */ }

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  // Already entitled? Don't charge again.
  const { data: paid } = await admin.from("purchases").select("id")
    .eq("user_id", uid).eq("product_key", "builder").eq("status", "paid").limit(1);
  if (paid && paid.length > 0) return json({ alreadyOwned: true });

  const { data: purchase, error: pErr } = await admin.from("purchases").insert({
    user_id: uid, product_key: "builder", status: "pending", provider: "whop",
  }).select("id").single();
  if (pErr) return json({ error: "db_error", message: pErr.message }, 500);

  // APP_URL (server config) wins over anything the client sends.
  const appUrl = Deno.env.get("APP_URL") ?? (typeof body.appUrl === "string" ? body.appUrl : null);

  try {
    const checkout = await createBuilderCheckout({
      userId: uid, purchaseId: purchase.id, redirectUrl: safeRedirect(appUrl),
    });
    await admin.from("purchases").update({ whop_checkout_config_id: checkout.id }).eq("id", purchase.id);
    return json({ url: checkout.url });
  } catch (e) {
    await admin.from("purchases").update({ status: "failed" }).eq("id", purchase.id);
    if (e instanceof WhopNotConfiguredError) return json({ error: "payments_not_configured", message: e.message }, 501);
    return json({ error: "checkout_unavailable", message: String((e as Error).message) }, 502);
  }
});
