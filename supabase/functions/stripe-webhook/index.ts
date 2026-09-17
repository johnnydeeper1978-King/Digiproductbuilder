// Edge Function: `stripe-webhook` — AUTHORITATIVE payment confirmation.
// Verifies the Stripe signature, then on checkout.session.completed marks the
// referenced purchase 'paid'. This is the ONLY path that grants Builder access.
import { getAdminClient } from "../_shared/supabaseAdmin.ts";
import { getStripe, getWebhookSecret, StripeNotConfiguredError } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  let stripe, secret;
  try { stripe = getStripe(); secret = getWebhookSecret(); }
  catch (e) {
    if (e instanceof StripeNotConfiguredError) return new Response(e.message, { status: 501 });
    throw e;
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  const raw = await req.text();

  let event;
  try { event = await stripe.webhooks.constructEventAsync(raw, sig, secret); }
  catch (e) { return new Response(`signature verification failed: ${(e as Error).message}`, { status: 400 }); }

  const admin = getAdminClient();

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as {
      id: string; payment_intent?: string; amount_total?: number; currency?: string;
      client_reference_id?: string; metadata?: Record<string, string>;
    };
    const purchaseId = s.metadata?.purchase_id ?? s.client_reference_id;
    if (purchaseId) {
      await admin.from("purchases").update({
        status: "paid",
        stripe_payment_intent_id: s.payment_intent ?? null,
        amount: s.amount_total ?? null,
        currency: s.currency ?? null,
      }).eq("id", purchaseId).neq("status", "paid"); // idempotent
      await admin.from("events").insert({
        user_id: s.metadata?.user_id ?? null,
        type: "purchase_completed",
        payload: { purchase_id: purchaseId, product_key: s.metadata?.product_key ?? "builder" },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
