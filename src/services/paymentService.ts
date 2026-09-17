/**
 * Payment boundary (client). Starts a Stripe Checkout via the server; the
 * browser only ever receives a redirect URL — never a Stripe secret. Access is
 * granted by the webhook, never by returning from checkout.
 */
import { env, isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { SupabaseNotConfiguredError } from "@/lib/supabase/client";

export class PaymentError extends Error {
  code?: string; status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message); this.name = "PaymentError"; this.code = code; this.status = status;
  }
}

export interface CheckoutResult { url?: string; alreadyOwned?: boolean; }

export const paymentService = {
  /** Begin the $47 Builder purchase. Returns a checkout URL to redirect to. */
  async startBuilderCheckout(): Promise<CheckoutResult> {
    if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
    const session = await authService.getSession().catch(() => null);
    if (!session?.access_token) throw new PaymentError("Please sign in to continue.", "unauthorized", 401);
    const res = await fetch(`${env.supabaseUrl}/functions/v1/stripe-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.supabaseAnonKey as string,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ appUrl: env.appUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as { message?: string; error?: string }).message
        ?? (data as { error?: string }).error ?? `Checkout failed (${res.status})`;
      throw new PaymentError(msg, (data as { error?: string }).error, res.status);
    }
    return data as CheckoutResult;
  },
};
