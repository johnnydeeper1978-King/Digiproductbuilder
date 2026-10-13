/**
 * Entitlement reads (client). Access is DERIVED from a paid purchases row that
 * only the Whop webhook can write — the client can read its own rows via RLS
 * but can never grant itself access. Server-side operations must also
 * re-check entitlement (see supabase/functions/_shared/entitlements.ts).
 */
import { requireSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import type { ProductKey } from "@/types/database";

async function hasAccess(productKey: ProductKey): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const session = await authService.getSession().catch(() => null);
  const uid = session?.user?.id;
  if (!uid) return false;
  const { data } = await requireSupabase().from("purchases")
    .select("id").eq("user_id", uid).eq("product_key", productKey).eq("status", "paid").maybeSingle();
  return Boolean(data);
}

export const entitlementsService = {
  hasBuilderAccess: () => hasAccess("builder"),
  hasDigitalMarketingOSAccess: () => hasAccess("digital-marketing-os"),
};
