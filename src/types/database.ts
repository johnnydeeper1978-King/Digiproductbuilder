/**
 * Row types for the Supabase schema (migrations 0002–0005). These correspond
 * 1:1 with the tables and reuse the schema-mirror types for JSON columns.
 * Single source of truth — do not duplicate these shapes elsewhere.
 */
import type { UserRole } from "./user";
import type {
  UserProfile, AvailableTime, BusinessPreference, BrandPreference, DiscoveryPathway,
} from "./schemas/user-profile";
import type { Opportunity } from "./schemas/opportunity";
import type { Blueprint } from "./schemas/blueprint";
import type { DiscoveryStatus } from "./schemas/discovery-output";

export type { Product } from "./product";

/** public.profiles */
export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  skills: string[] | null;
  experience: string[] | null;
  interests: string[] | null;
  goals: string[] | null;
  available_time: AvailableTime | null;
  business_preference: BusinessPreference | null;
  brand_preference: BrandPreference | null;
  discovery_pathway: DiscoveryPathway[] | null;
  potential_niches: string[] | null;
  customer_problems: string[] | null;
  created_at: string;
  updated_at: string;
}

/** public.discovery_sessions */
export interface DiscoverySession {
  id: string;
  user_id: string | null;
  anon_token: string;
  status: DiscoveryStatus;
  user_profile: UserProfile | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** public.discovery_answers — raw, recoverable answers (never destroyed). */
export interface DiscoveryAnswer {
  id: string;
  session_id: string;
  question_key: string;
  question_text: string | null;
  answer: unknown;
  sequence: number | null;
  created_at: string;
}

/** public.opportunities — `data` validated against opportunity.schema.json. */
export interface OpportunityRow {
  id: string;
  session_id: string;
  opportunity_ref: string | null;
  data: Opportunity;
  is_unexpected: boolean;
  is_selected: boolean;
  score_overall: number | null;
  created_at: string;
  updated_at: string;
}

/** public.blueprints — `data` validated against blueprint.schema.json. */
export interface BlueprintRow {
  id: string;
  session_id: string | null;
  user_id: string | null;
  source_opportunity_ref: string | null;
  data: Blueprint;
  created_at: string;
  updated_at: string;
}

export type AIProviderName = "openai" | "anthropic" | "perplexity";
export type AiRunStatus = "pending" | "running" | "succeeded" | "failed";
export type AiValidationStatus = "not_validated" | "valid" | "invalid";

/** public.ai_runs — audit record. Never stores secrets/credentials. */
export interface AiRun {
  id: string;
  user_id: string | null;
  session_id: string | null;
  run_type: string;
  provider: AIProviderName | null;
  model: string | null;
  status: AiRunStatus;
  input_metadata: Record<string, unknown> | null;
  output: unknown;
  validation_status: AiValidationStatus;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

/** public.events — generic application event/audit log. */
export interface EventRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export type PurchaseStatus = "pending" | "paid" | "failed" | "refunded" | "disputed";
export type ProductKey = "builder" | "digital-marketing-os" | "adhd-system" | "budgeting-system" | "launch-system" | "content-toolkit";

/** public.purchases — authoritative entitlement record (webhook-written). */
export interface Purchase {
  id: string;
  /** Null until a plain (non-dynamic) Whop-link buyer signs up and claims it by email. */
  user_id: string | null;
  product_key: ProductKey;
  status: PurchaseStatus;
  provider: string;
  amount: number | null;
  currency: string | null;
  /** Whop's own identifiers for this payment. */
  whop_payment_id: string | null;
  whop_membership_id: string | null;
  whop_checkout_config_id: string | null;
  /** Set by the webhook for unclaimed (plain-link) purchases; used to auto-claim on sign-in. */
  buyer_email: string | null;
  created_at: string;
  updated_at: string;
}
