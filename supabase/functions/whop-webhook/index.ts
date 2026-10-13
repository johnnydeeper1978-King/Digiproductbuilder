// Edge Function: `whop-webhook` — AUTHORITATIVE payment confirmation.
// Verifies the Whop webhook signature, then on a successful payment event
// marks the matching purchases row 'paid'. This is the ONLY path that grants
// Builder / Digital Marketing OS access.
//
// Whop does not know our Supabase user_id, so the match is by email: the
// buyer's Whop checkout email must match the email they signed up to the app
// with (see the note on Paywall.tsx). If no matching auth user exists yet,
// the purchase is recorded unmatched and reconciled manually — it is never
// silently dropped.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabaseAdmin.ts";

// Maps a Whop plan ID to our internal product key. Set these once the Whop
// products exist — WHOP_BUILDER_PLAN_ID is required for the live Builder
// product; WHOP_DMOS_PLAN_ID is optional until Digital Marketing OS ships.
function productKeyForPlan(planId: string | undefined): "builder" | "digital-marketing-os" | null {
  if (!planId) return null;
  if (planId === Deno.env.get("WHOP_BUILDER_PLAN_ID")) return "builder";
  if (planId === Deno.env.get("WHOP_DMOS_PLAN_ID")) return "digital-marketing-os";
  return null;
}

async function verifySignature(raw: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Whop signs as `sha256=<hex>` — accept either form.
  const provided = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  return expected === provided;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  if (!secret) return json({ error: "not_configured", message: "WHOP_WEBHOOK_SECRET is not configured." }, 501);

  const raw = await req.text();
  const sig = req.headers.get("x-whop-signature") ?? req.headers.get("whop-signature");
  if (!(await verifySignature(raw, sig, secret))) {
    return json({ error: "invalid_signature" }, 400);
  }

  let event: {
    action?: string;
    data?: {
      id?: string;
      plan_id?: string;
      email?: string;
      user?: { email?: string };
      final_amount?: number;
      currency?: string;
      membership_id?: string;
      receipt_id?: string;
    };
  };
  try { event = JSON.parse(raw); } catch { return json({ error: "invalid_payload" }, 400); }

  // Whop's successful-payment events: "payment.succeeded" (one-time) or
  // "membership.went_valid" (access granted). VERIFY BEFORE LAUNCH against
  // the current Whop webhook docs/dashboard — event names/shapes do change.
  const action = event.action ?? "";
  if (action !== "payment.succeeded" && action !== "membership.went_valid") {
    return json({ received: true, ignored: action });
  }

  const d = event.data ?? {};
  const productKey = productKeyForPlan(d.plan_id);
  const buyerEmail = (d.email ?? d.user?.email ?? "").trim().toLowerCase();

  if (!productKey || !buyerEmail) {
    return json({ received: true, unmatched: true, reason: "missing product_key or buyer email" });
  }

  const admin = getAdminClient();

  // Resolve the Supabase auth user by email. If they haven't signed up yet,
  // record nothing destructive — just report unmatched so it can be
  // reconciled once they do (their next successful sign-in + support ping).
  const { data: usersPage, error: lookupErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (lookupErr) return json({ error: "lookup_failed", message: lookupErr.message }, 500);
  const matchedUser = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === buyerEmail);

  if (!matchedUser) {
    await admin.from("events").insert({
      type: "purchase_unmatched",
      payload: { product_key: productKey, email: buyerEmail, whop_membership_id: d.membership_id ?? d.id ?? null },
    });
    return json({ received: true, unmatched: true });
  }

  await admin.from("purchases").upsert({
    user_id: matchedUser.id,
    product_key: productKey,
    status: "paid",
    provider: "whop",
    amount: d.final_amount ?? null,
    currency: d.currency ?? null,
    whop_membership_id: d.membership_id ?? d.id ?? null,
    whop_receipt_id: d.receipt_id ?? null,
  }, { onConflict: "user_id,product_key" });

  await admin.from("events").insert({
    user_id: matchedUser.id,
    type: "purchase_completed",
    payload: { product_key: productKey, provider: "whop" },
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
