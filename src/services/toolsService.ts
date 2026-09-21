/**
 * Tool-recommendation catalogue (read-only client). Affiliate URLs are only
 * present when a real relationship is configured server-side — never fabricated.
 */
import { requireSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/config/env";

export interface Tool {
  id: string; name: string; category: string;
  purpose: string | null; recommended_use: string | null; alternative: string | null;
  affiliate_url: string | null; is_affiliate: boolean; disclosure: string | null;
}

export const toolsService = {
  async all(): Promise<Tool[]> {
    if (!isSupabaseConfigured) return [];
    const { data } = await requireSupabase().from("tools")
      .select("id,name,category,purpose,recommended_use,alternative,affiliate_url,is_affiliate,disclosure")
      .eq("active", true).order("category");
    return (data ?? []) as Tool[];
  },

  async byCategory(category: string): Promise<Tool[]> {
    if (!isSupabaseConfigured) return [];
    const { data } = await requireSupabase().from("tools")
      .select("id,name,category,purpose,recommended_use,alternative,affiliate_url,is_affiliate,disclosure")
      .eq("category", category).eq("active", true);
    return (data ?? []) as Tool[];
  },
};
