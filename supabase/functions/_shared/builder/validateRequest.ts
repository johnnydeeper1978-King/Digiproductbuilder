// Pure, runtime-agnostic Builder request validation (unit-testable).
import { BUILDER_PHASE_ORDER, type BuilderPhase } from "../prompts/builder.ts";

export type BuilderAction = "get" | "list" | "create" | "input" | "generate" | "advance" | "goto" | "complete";
const ACTIONS: BuilderAction[] = ["get", "list", "create", "input", "generate", "advance", "goto", "complete"];

export interface BuilderRequest {
  action: BuilderAction;
  productId?: string;
  phase?: BuilderPhase;
  inputs?: Record<string, unknown>;
  name?: string;
}

export interface ValidationResult { valid: boolean; error?: string; value?: BuilderRequest; }

export function validateBuilderRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { valid: false, error: "invalid_body" };
  const b = body as Record<string, unknown>;
  const action = b.action as BuilderAction;
  if (!ACTIONS.includes(action)) return { valid: false, error: "unknown_action" };

  // Actions that operate on a specific product need a productId.
  const needsProduct: BuilderAction[] = ["get", "input", "generate", "advance", "goto", "complete"];
  if (needsProduct.includes(action) && typeof b.productId !== "string") {
    return { valid: false, error: "missing_product_id" };
  }
  // Phase-bearing actions need a valid phase.
  const needsPhase: BuilderAction[] = ["input", "generate", "advance", "goto"];
  if (needsPhase.includes(action)) {
    if (typeof b.phase !== "string" || !BUILDER_PHASE_ORDER.includes(b.phase as BuilderPhase)) {
      return { valid: false, error: "invalid_phase" };
    }
  }
  if (action === "input" && (typeof b.inputs !== "object" || b.inputs === null)) {
    return { valid: false, error: "missing_inputs" };
  }
  return { valid: true, value: b as unknown as BuilderRequest };
}
