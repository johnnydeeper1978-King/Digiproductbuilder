// Edge Function: `whop-checkout`
// A signed-in user starts a purchase of any LIVE catalog product (Builder or a
// Marketplace system). Body: { productKey?: string = "builder" }.
// Creates a PENDING purchases row and a Whop checkout whose metadata carries the
// user + purchase + product ids, then returns the checkout URL. Access is NOT
// granted here — only the verified webhook marks a purchase 'paid'.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { createCheckout, resolvePlanId, WhopNotConfiguredError } from "../_shared/whop.ts";

const KEY = /^[a-z0-9-]{2,40}$/;

function safeRedirect(appUrl: string | null, productKey: string): string | undefined {
  if (!appUrl) return undefined;
  try {
    const u = new URL(appUrl);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return undefined;
    return productKey === "builder"
      ? `${u.origin}/builder?checkout=success`
      : `${u.origin}/library/${productKey}?checkout=success`;
  } catch { return undefined; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const uid = await getCallerUid(req.headers.get("Authorization"));
  if (!uid) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional body */ }
  const productKey = typeof body.productKey === "string" ? body.productKey : "builder";
  if (!KEY.test(productKey)) return json({ error: "invalid_product" }, 400);

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  const { data: product } = await admin.from("catalog_products")
    .select("key, status, whop_product_id, whop_plan_id").eq("key", productKey).maybeSingle();
  if (!product) return json({ error: "invalid_product" }, 404);
  if (product.status !== "live") return json({ error: "not_on_sale", status: product.status }, 409);
  if (!product.whop_product_id) return json({ error: "payments_not_configured", message: "No Whop product linked." }, 501);

  // Already entitled? Don't charge again.
  const { data: paid } = await admin.from("purchases").select("id")
    .eq("user_id", uid).eq("product_key", productKey).eq("status", "paid").limit(1);
  if (paid && paid.length > 0) return json({ alreadyOwned: true });

  const { data: purchase, error: pErr } = await admin.from("purchases").insert({
    user_id: uid, product_key: productKey, status: "pending", provider: "whop",
  }).select("id").single();
  if (pErr) return json({ error: "db_error", message: pErr.message }, 500);

  // APP_URL (server config) wins over anything the client sends.
  const appUrl = Deno.env.get("APP_URL") ?? (typeof body.appUrl === "string" ? body.appUrl : null);

  try {
    const planId = await resolvePlanId(product.whop_product_id, product.whop_plan_id);
    const checkout = await createCheckout({
      planId, userId: uid, purchaseId: purchase.id, productKey,
      redirectUrl: safeRedirect(appUrl, productKey),
    });
    await admin.from("purchases").update({ whop_checkout_config_id: checkout.id }).eq("id", purchase.id);
    return json({ url: checkout.url });
  } catch (e) {
    await admin.from("purchases").update({ status: "failed" }).eq("id", purchase.id);
    if (e instanceof WhopNotConfiguredError) return json({ error: "payments_not_configured", message: e.message }, 501);
    return json({ error: "checkout_unavailable", message: String((e as Error).message) }, 502);
  }
});
