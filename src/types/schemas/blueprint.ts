/**
 * TypeScript mirror of schemas/blueprint.schema.json.
 * The JSON Schema is the source of truth — keep these in sync.
 */
import type { ProductFormat } from "./opportunity";

export interface BlueprintProduct {
  name: string;
  concept: string;
  format?: ProductFormat;
  corePromise?: string;
}
export interface BlueprintBuyer {
  targetCustomer: string;
  customerProfile?: string;
  problem: string;
  desiredOutcome: string;
}
export interface BlueprintPositioning {
  mainPositioning?: string;
  differentiation?: string;
  keyPromise?: string;
  whyThisProduct?: string;
}
export interface BlueprintModule { title: string; description?: string; }
export interface BlueprintContent {
  modules?: BlueprintModule[];
  deliverables?: string[];
  resources?: string[];
  assets?: string[];
}
export interface BlueprintPricing {
  suggestedPrice?: number;
  currency?: string;
  priceHypothesis?: string;
  reasoning: string;
}
export interface BlueprintMarketing {
  contentAngles?: string[];
  hooks?: string[];
  platforms?: string[];
  leadMagnets?: string[];
  conversionPath?: string;
}
export interface BlueprintLaunchStep { step: string; description?: string; }
export interface BlueprintLaunch { sequence?: BlueprintLaunchStep[]; }

export interface Blueprint {
  product: BlueprintProduct;
  buyer: BlueprintBuyer;
  positioning?: BlueprintPositioning;
  content?: BlueprintContent;
  pricing?: BlueprintPricing;
  marketing?: BlueprintMarketing;
  launch?: BlueprintLaunch;
  nextStep?: string;
}
