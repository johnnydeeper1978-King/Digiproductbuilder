/**
 * Reseller link client service. Calls `whop-affiliate`, which enrolls the
 * signed-in (and entitled) user as a Whop affiliate and returns their own
 * trackable link — Whop handles tracking, attribution and payout.
 */
import { env, isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { SupabaseNotConfiguredError } from "@/lib/supabase/client";
import type { ProductKey } from "@/types/database";

export class ResellerError extends Error {
  code?: string; status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message); this.name = "ResellerError"; this.code = code; this.status = status;
  }
}

async function getOrCreateLink(productKey: ProductKey): Promise<{ link: string; commissionPercent: number }> {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
  const session = await authService.getSession().catch(() => null);
  if (!session?.access_token) throw new ResellerError("Please sign in.", "unauthorized", 401);

  const res = await fetch(`${env.supabaseUrl}/functions/v1/whop-affiliate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.supabaseAnonKey as string,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ productKey }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message
      ?? (data as { error?: string }).error ?? `Couldn't generate your link (${res.status})`;
    throw new ResellerError(msg, (data as { error?: string }).error, res.status);
  }
  return data as { link: string; commissionPercent: number };
}

export const resellerService = { getOrCreateLink };
