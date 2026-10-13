// Edge Function: `whop-affiliate` — self-serve reseller links.
// A signed-in, PAID owner of a catalog product can generate their own Whop
// affiliate link for it, right from the 369 dashboard. Whop still does every
// bit of the real work (tracking, attribution, payout) — this just automates
// the two dashboard steps (enroll as affiliate, add a per-plan rate) a buyer
// would otherwise have to do by hand on whop.com.
// Idempotent: calling it again returns the same link instead of a duplicate.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { hasEntitlement } from "../_shared/entitlements.ts";
import {
  resolvePlanId, enrollAffiliate, listStandardOverrides, createStandardOverride, WhopNotConfiguredError,
} from "../_shared/whop.ts";

const KEY = /^[a-z0-9-]{2,40}$/;

// Reseller commission per product (percentage of each sale, every payment —
// these are one-time products so "first" vs "all" is moot). Override per
// deploy with WHOP_RESELLER_COMMISSION_PERCENT if the rate ever changes.
const DEFAULT_COMMISSION_PERCENT = 50;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const uid = await getCallerUid(req.headers.get("Authorization"));
  if (!uid) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional body */ }
  const productKey = typeof body.productKey === "string" ? body.productKey : "digital-marketing-os";
  if (!KEY.test(productKey)) return json({ error: "invalid_product" }, 400);

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  // Only paid owners can become resellers of a product.
  if (!(await hasEntitlement(admin, uid, productKey))) {
    return json({ error: "not_entitled", productKey }, 403);
  }

  const { data: u } = await admin.auth.admin.getUserById(uid);
  const email = u?.user?.email;
  if (!email || !u?.user?.email_confirmed_at) {
    return json({ error: "email_not_confirmed", message: "Confirm your account email before generating a reseller link." }, 409);
  }

  const { data: product } = await admin.from("catalog_products")
    .select("whop_product_id, whop_plan_id").eq("key", productKey).maybeSingle();
  if (!product?.whop_product_id) return json({ error: "payments_not_configured" }, 501);

  const commissionPercent = Number(Deno.env.get("WHOP_RESELLER_COMMISSION_PERCENT")) || DEFAULT_COMMISSION_PERCENT;

  try {
    const planId = await resolvePlanId(product.whop_product_id, product.whop_plan_id);
    const affiliate = await enrollAffiliate(email);

    // Already has a reseller rate for this exact plan? Return the existing link
    // rather than creating a duplicate override on every click.
    const existing = (await listStandardOverrides(affiliate.id)).find((o) => o.plan_id === planId);
    if (existing) {
      return json({
        link: existing.checkout_direct_link ?? existing.product_direct_link,
        commissionPercent: existing.commission_value,
      });
    }

    const created = await createStandardOverride({ affiliateId: affiliate.id, planId, commissionPercent });
    return json({
      link: created.checkout_direct_link ?? created.product_direct_link,
      commissionPercent: created.commission_value,
    });
  } catch (e) {
    if (e instanceof WhopNotConfiguredError) return json({ error: "payments_not_configured", message: e.message }, 501);
    return json({ error: "affiliate_unavailable", message: String((e as Error).message) }, 502);
  }
});
