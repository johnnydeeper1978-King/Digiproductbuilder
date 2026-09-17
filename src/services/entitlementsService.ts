/**
 * Entitlement reads (client). Access is DERIVED from a paid purchases row that
 * only the Stripe webhook can write — the client can read its own rows via RLS
 * but can never grant itself access. Server-side Builder operations must also
 * re-check entitlement (see supabase/functions/_shared/entitlements.ts).
 */
import { requireSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";

export const entitlementsService = {
  async hasBuilderAccess(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const session = await authService.getSession().catch(() => null);
    const uid = session?.user?.id;
    if (!uid) return false;
    const { data } = await requireSupabase().from("purchases")
      .select("id").eq("user_id", uid).eq("product_key", "builder").eq("status", "paid").maybeSingle();
    return Boolean(data);
  },
};
