/**
 * Checkout client service. Every call goes through the `whop-checkout` edge
 * function, which creates a Whop checkout carrying the signed-in user's id in
 * its metadata — the authoritative path to a correctly-matched purchase (see
 * supabase/functions/whop-webhook). Access is never granted here.
 */
import { env, isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { SupabaseNotConfiguredError } from "@/lib/supabase/client";
import type { ProductKey } from "@/types/database";

export class CheckoutError extends Error {
  code?: string; status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message); this.name = "CheckoutError"; this.code = code; this.status = status;
  }
}

/** Starts a Whop checkout for the given product and returns its URL. */
async function startCheckout(productKey: ProductKey): Promise<string> {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
  const session = await authService.getSession().catch(() => null);
  if (!session?.access_token) throw new CheckoutError("Please sign in.", "unauthorized", 401);

  const res = await fetch(`${env.supabaseUrl}/functions/v1/whop-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.supabaseAnonKey as string,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ productKey, appUrl: env.appUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message
      ?? (data as { error?: string }).error ?? `Checkout failed (${res.status})`;
    throw new CheckoutError(msg, (data as { error?: string }).error, res.status);
  }
  if ((data as { alreadyOwned?: boolean }).alreadyOwned) {
    throw new CheckoutError("You already own this.", "already_owned", 200);
  }
  const url = (data as { url?: string }).url;
  if (!url) throw new CheckoutError("No checkout URL returned.", "no_url", 500);
  return url;
}

export const checkoutService = { startCheckout };
