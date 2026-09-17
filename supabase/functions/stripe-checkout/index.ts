// Edge Function: `stripe-checkout`
// Authenticated user starts a $47 Builder purchase. Creates a PENDING purchases
// row and a Stripe Checkout Session, and returns the redirect URL. Access is
// NOT granted here — only the webhook flips a purchase to 'paid'.
// Honest config error if Stripe env is missing. No secret ever reaches the client.
import { corsHeaders, json } from "../_shared/cors.ts";
import { getAdminClient, getCallerUid } from "../_shared/supabaseAdmin.ts";
import { getStripe, getBuilderPriceId, StripeNotConfiguredError } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const uid = await getCallerUid(req.headers.get("Authorization"));
  if (!uid) return json({ error: "unauthorized" }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* optional body */ }
  const appUrl = String(body.appUrl ?? Deno.env.get("APP_URL") ?? "");

  let admin;
  try { admin = getAdminClient(); }
  catch (e) { return json({ error: "not_configured", message: String((e as Error).message) }, 501); }

  // Already entitled? Don't charge again.
  const { data: paid } = await admin.from("purchases").select("id")
    .eq("user_id", uid).eq("product_key", "builder").eq("status", "paid").maybeSingle();
  if (paid) return json({ alreadyOwned: true });

  let stripe, priceId;
  try { stripe = getStripe(); priceId = getBuilderPriceId(); }
  catch (e) {
    if (e instanceof StripeNotConfiguredError) return json({ error: "payments_not_configured", message: e.message }, 501);
    throw e;
  }

  const { data: purchase, error: pErr } = await admin.from("purchases").insert({
    user_id: uid, product_key: "builder", status: "pending", provider: "stripe",
  }).select("id").single();
  if (pErr) return json({ error: "db_error", message: pErr.message }, 500);

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/builder?checkout=success`,
    cancel_url: `${appUrl}/builder?checkout=cancelled`,
    client_reference_id: purchase.id,
    metadata: { purchase_id: purchase.id, user_id: uid, product_key: "builder" },
  });

  await admin.from("purchases").update({ stripe_checkout_session_id: checkout.id }).eq("id", purchase.id);
  return json({ url: checkout.url });
});
