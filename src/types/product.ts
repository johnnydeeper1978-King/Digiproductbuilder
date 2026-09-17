/** Product / project domain types — corresponds to public.products. */
export const MAX_PRODUCTS = 3;

export type ProductStatus = "draft" | "active" | "archived";

/** Phases mirror the Builder journey. */
export type ProductPhase =
  | "strategy" | "customer" | "offer" | "creation" | "brand"
  | "landing" | "payment" | "content" | "launch" | "optimization";

export interface Product {
  id: string;
  user_id: string;
  name: string;
  status: ProductStatus;
  current_phase: ProductPhase;
  /** 0–100 completion. */
  progress: number;
  /** Future linkage (nullable until Discovery/Builder phases wire them). */
  discovery_session_id: string | null;
  blueprint_id: string | null;
  opportunity_id: string | null;
  builder_state: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
