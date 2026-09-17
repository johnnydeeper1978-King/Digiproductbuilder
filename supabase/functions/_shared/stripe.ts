// Stripe boundary (Deno, SERVER ONLY). Secret key + price id come from
// Deno.env; never bundled into the browser. Honest errors when unconfigured.
import Stripe from "npm:stripe@16";

export class StripeNotConfiguredError extends Error {
  constructor(message: string) { super(message); this.name = "StripeNotConfiguredError"; }
}

export function getStripe(): Stripe {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new StripeNotConfiguredError("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export function getBuilderPriceId(): string {
  const id = Deno.env.get("STRIPE_BUILDER_PRICE_ID");
  if (!id) throw new StripeNotConfiguredError("STRIPE_BUILDER_PRICE_ID is not configured.");
  return id;
}

export function getWebhookSecret(): string {
  const s = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!s) throw new StripeNotConfiguredError("STRIPE_WEBHOOK_SECRET is not configured.");
  return s;
}
