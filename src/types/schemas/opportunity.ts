/**
 * TypeScript mirror of schemas/opportunity.schema.json.
 * The JSON Schema is the source of truth — keep these in sync.
 */
export type ProductFormat =
  | "ebook" | "guide" | "template" | "spreadsheet" | "checklist" | "prompt-pack"
  | "notion-system" | "course" | "workshop" | "toolkit" | "swipe-file"
  | "calculator" | "planner" | "database" | "membership" | "other";

export type EvidenceType = "user-fit" | "hypothesis" | "research-backed";

export interface Evidence {
  type: EvidenceType;
  statement: string;
  source?: string;
}

/**
 * ⚠️ SCORING RECONCILIATION REQUIRED — DO NOT IMPLEMENT THE SCORER YET.
 *
 * This `breakdown` mirrors opportunity.schema.json (7 keys). It does NOT match
 * knowledge/product-scoring.md, which defines a 10-category / 100-point model
 * (User Fit, Problem Clarity, Audience Clarity, Product Specificity, Creation
 * Simplicity, Time Fit, Marketing Potential, Business Style Fit, First Product
 * Potential, Expansion Potential).
 *
 * See docs/SCORING_RECONCILIATION.md. The schema + this type must be reconciled
 * with product-scoring.md before any scoring engine is built. This is a
 * decision for the project owner — do not resolve it unilaterally.
 */
export interface OpportunityScoreBreakdown {
  userFit?: number;
  problemClarity?: number;
  buyerClarity?: number;
  feasibility?: number;
  differentiation?: number;
  demandSignals?: number;
  distributionPotential?: number;
}

export interface OpportunityScore {
  overall: number;
  breakdown?: OpportunityScoreBreakdown;
}

export interface Opportunity {
  id?: string;
  name: string;
  description?: string;
  targetBuyer: string;
  problem: string;
  outcome: string;
  productFormat: ProductFormat;
  score?: OpportunityScore;
  reasoning?: string;
  isUnexpected?: boolean;
  evidence?: Evidence[];
}
