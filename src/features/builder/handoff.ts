/**
 * Builder handoff boundary. Assembles the context the Builder needs to start
 * from a completed Discovery — WITHOUT restarting Discovery. The Builder reads
 * this instead of re-asking anything Discovery already captured.
 */
import { requireSupabase } from "@/lib/supabase/client";
import { authService } from "@/services/authService";
import type { Blueprint } from "@/types/schemas/blueprint";
import type { UserProfile } from "@/types/schemas/user-profile";

export interface BuilderContext {
  blueprint: Blueprint | null;
  userProfile: UserProfile | null;
  productId: string | null;
  discoverySessionId: string | null;
  /** True when the user arrived via the direct Builder path (no Discovery). */
  fromDirectPurchase: boolean;
}

export const builderHandoff = {
  /** Load the Builder's starting context for the current authenticated user. */
  async getContext(): Promise<BuilderContext> {
    const empty: BuilderContext = {
      blueprint: null, userProfile: null, productId: null,
      discoverySessionId: null, fromDirectPurchase: true,
    };
    const session = await authService.getSession().catch(() => null);
    const uid = session?.user?.id;
    if (!uid) return empty;

    const sb = requireSupabase();
    // Most recent product with a blueprint is the handoff target, if any.
    const { data: product } = await sb.from("products")
      .select("id, discovery_session_id, blueprint_id")
      .eq("user_id", uid).not("blueprint_id", "is", null)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();

    if (!product?.blueprint_id) return empty;

    const { data: bp } = await sb.from("blueprints").select("data").eq("id", product.blueprint_id).maybeSingle();
    let userProfile: UserProfile | null = null;
    if (product.discovery_session_id) {
      const { data: s } = await sb.from("discovery_sessions")
        .select("user_profile").eq("id", product.discovery_session_id).maybeSingle();
      userProfile = (s?.user_profile as UserProfile) ?? null;
    }
    return {
      blueprint: (bp?.data as Blueprint) ?? null,
      userProfile,
      productId: product.id,
      discoverySessionId: product.discovery_session_id ?? null,
      fromDirectPurchase: false,
    };
  },
};
