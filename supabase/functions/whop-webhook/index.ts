// Edge Function: `whop-webhook` — AUTHORITATIVE payment confirmation.
// Deployed with verify_jwt=false: Whop can't send a Supabase JWT, so the
// Standard Webhooks signature below is the authentication.
//   payment.succeeded -> purchase marked 'paid' (the ONLY path to paid access,
//                        for the Builder and every Marketplace product)
//   dispute.created   -> purchase marked 'disputed' (access paused)
// The product is resolved from the Whop product id via catalog_products
// (metadata is only a fallback). Idempotent on webhook-id.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getAdminClient } from "../_shared/supabaseAdmin.ts";
import { verifyWhopSignature, whopIds } from "../_shared/whop.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// deno-lint-ignore no-explicit-any
type Obj = Record<string, any>;

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

async function logEvent(admin: SupabaseClient, userId: string | null, type: string, payload: Obj) {
  await admin.from("events").insert({ user_id: userId, type, payload });
}

/** Map the paid Whop product to our catalog key. Product id wins over metadata. */
async function resolveProductKey(admin: SupabaseClient, whopProductId: string | null, meta: Obj): Promise<string | null> {
  if (whopProductId) {
    const { data } = await admin.from("catalog_products").select("key").eq("whop_product_id", whopProductId).maybeSingle();
    if (data) return data.key as string;
    if (whopProductId === whopIds().builderProductId) return "builder";
    return null; // a Whop product we don't sell through the platform
  }
  const metaKey = text(meta.product_key);
  if (!metaKey) return null;
  const { data } = await admin.from("catalog_products").select("key").eq("key", metaKey).maybeSingle();
  return data ? (data.key as string) : null;
}

async function handlePayment(admin: SupabaseClient, p: Obj) {
  const meta: Obj = p.metadata ?? {};
  const whopProductId = text(p.product?.id) ?? text(p.product_id);
  const productKey = await resolveProductKey(admin, whopProductId, meta);
  if (!productKey) {
    await logEvent(admin, null, "whop_payment_ignored", { payment_id: p.id, product_id: whopProductId });
    return;
  }

  const paymentId = text(p.id);
  if (!paymentId) throw new Error("payment.succeeded without payment id");

  // Retry of an already-fulfilled payment.
  const { data: done } = await admin.from("purchases").select("id").eq("whop_payment_id", paymentId).limit(1);
  if (done && done.length > 0) return;

  const email = (text(p.user?.email) ?? text(p.email) ?? text(p.member?.email))?.toLowerCase() ?? null;
  // Whop amounts are in dollars; purchases.amount is in cents.
  const total = typeof p.total === "number" ? p.total : typeof p.subtotal === "number" ? p.subtotal : null;
  const paidFields = {
    status: "paid",
    provider: "whop",
    whop_payment_id: paymentId,
    whop_membership_id: text(p.membership?.id) ?? text(p.membership_id),
    buyer_email: email,
    amount: total === null ? null : Math.round(total * 100),
    currency: text(p.currency),
  };

  // 1. Our own checkout: flip the pending row created by whop-checkout
  //    (only if it is for the same product that was actually paid).
  if (typeof meta.purchase_id === "string" && UUID.test(meta.purchase_id)) {
    const { data: updated } = await admin.from("purchases")
      .update(paidFields).eq("id", meta.purchase_id).eq("product_key", productKey)
      .neq("status", "paid").select("id, user_id");
    if (updated && updated.length > 0) {
      await logEvent(admin, updated[0].user_id, "purchase_completed", { purchase_id: updated[0].id, product_key: productKey, source: "checkout" });
      return;
    }
  }

  // 2. Plain Whop link: match the account by metadata user id, then by email.
  let userId: string | null = typeof meta.user_id === "string" && UUID.test(meta.user_id) ? meta.user_id : null;
  if (!userId && email) {
    const { data } = await admin.rpc("find_user_id_by_email", { p_email: email });
    userId = (data as string | null) ?? null;
  }

  // Unmatched buyers get an unclaimed row; they claim it on sign-in with the
  // same confirmed email (see _shared/entitlements.ts).
  const { data: inserted, error } = await admin.from("purchases")
    .insert({ user_id: userId, product_key: productKey, ...paidFields }).select("id").single();
  if (error && error.code !== "23505") throw new Error(error.message);
  await logEvent(admin, userId, "purchase_completed", {
    purchase_id: inserted?.id ?? null, product_key: productKey, source: userId ? "link_matched" : "link_unclaimed",
  });
}

async function handleDispute(admin: SupabaseClient, d: Obj) {
  const paymentId = text(d.payment?.id) ?? text(d.payment_id);
  if (!paymentId) return;
  const { data } = await admin.from("purchases")
    .update({ status: "disputed" }).eq("whop_payment_id", paymentId).select("id, user_id");
  await logEvent(admin, data?.[0]?.user_id ?? null, "purchase_disputed", { payment_id: paymentId, dispute_id: d.id ?? null });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  const secret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  if (!secret) return new Response("WHOP_WEBHOOK_SECRET is not configured", { status: 501 });

  const raw = await req.text(); // raw bytes: parsing first would break the signature
  if (!(await verifyWhopSignature(raw, req.headers, secret))) {
    return new Response("invalid signature", { status: 401 });
  }

  let event: Obj;
  try { event = JSON.parse(raw); } catch { return new Response("invalid json", { status: 400 }); }

  const admin = getAdminClient();
  const webhookId = req.headers.get("webhook-id")!;

  const { error: dupErr } = await admin.from("webhook_events")
    .insert({ id: webhookId, provider: "whop", type: String(event.type ?? "") });
  if (dupErr) {
    if (dupErr.code === "23505") return new Response("duplicate", { status: 200 });
    return new Response("db error", { status: 500 });
  }

  try {
    if (event.type === "payment.succeeded") await handlePayment(admin, event.data ?? {});
    else if (event.type === "dispute.created") await handleDispute(admin, event.data ?? {});
  } catch (e) {
    // Release the idempotency key so Whop's retry can process it.
    await admin.from("webhook_events").delete().eq("id", webhookId);
    console.error("whop-webhook failed", (e as Error).message);
    return new Response("processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
