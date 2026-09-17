/**
 * TypeScript mirror of schemas/user-profile.schema.json.
 * The JSON Schema is the source of truth — keep these in sync; do not diverge.
 */
export type CommitmentLevel = "minimal" | "part-time" | "full-time" | "flexible";
export type Complexity = "simple" | "moderate" | "complex";
export type PricePreference = "low" | "mid" | "premium" | "no-preference";
export type BrandPreference = "personal-brand" | "faceless" | "either" | "undecided";
export type DiscoveryPathway =
  | "expertise-driven"
  | "interest-driven"
  | "problem-driven"
  | "existing-product-driven";

export interface AvailableTime {
  hoursPerWeek?: number;
  commitment?: CommitmentLevel;
  description?: string;
}

export interface BusinessPreference {
  model?: string;
  complexity?: Complexity;
  pricePreference?: PricePreference;
  audiencePreference?: string;
  deliveryPreference?: string;
}

export interface UserProfile {
  skills?: string[];
  experience?: string[];
  interests?: string[];
  goals?: string[];
  availableTime?: AvailableTime;
  businessPreference?: BusinessPreference;
  brandPreference?: BrandPreference;
  discoveryPathway?: DiscoveryPathway[];
  potentialNiches?: string[];
  customerProblems?: string[];
}
