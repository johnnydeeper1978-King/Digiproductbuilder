/**
 * Deterministically map raw Discovery answers into a schema-shaped UserProfile
 * (user-profile.schema.json) plus non-schema metadata. This is a structural
 * transform of the user's own raw answers — NOT AI, NOT scoring. Raw answers
 * remain the source of truth in discovery_answers; this never mutates them.
 */
import type { AnswerMap, AnswerValue } from "./types";
import type {
  UserProfile, BrandPreference, Complexity, PricePreference, CommitmentLevel,
} from "@/types/schemas/user-profile";

const asArray = (v: AnswerValue | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === "string" && v.trim() ? [v.trim()] : [];
const asString = (v: AnswerValue | undefined): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

const TIME_TO_COMMITMENT: Record<string, CommitmentLevel> = {
  "under-5": "minimal", "5-10": "part-time", "10-20": "part-time",
  "20-plus": "full-time", "varies": "flexible",
};
const PATH_TO_PATHWAY: Record<string, UserProfile["discoveryPathway"]> = {
  know: ["expertise-driven"], interested: ["interest-driven"],
  opportunity: ["problem-driven"],
  decide: ["expertise-driven", "interest-driven", "problem-driven"],
};

export interface MappedProfile {
  userProfile: UserProfile;
  metadata: Record<string, unknown>;
}

export function mapAnswersToProfile(a: AnswerMap): MappedProfile {
  const brand = asString(a.brand_type);
  const complexity = asString(a.complexity);
  const price = asString(a.price_preference);
  const time = asString(a.weekly_time);

  const userProfile: UserProfile = {
    skills: asArray(a.skills),
    experience: asArray(a.experience),
    interests: asArray(a.interests),
    goals: asArray(a.primary_goals),
    customerProblems: asArray(a.solved_problems),
    potentialNiches: asArray(a.markets_of_interest),
    availableTime: time ? { commitment: TIME_TO_COMMITMENT[time], description: time } : undefined,
    businessPreference: {
      complexity: (complexity as Complexity | undefined),
      pricePreference: (price as PricePreference | undefined),
      deliveryPreference: asArray(a.preferred_formats).join(", ") || undefined,
    },
    brandPreference: (brand as BrandPreference | undefined),
    discoveryPathway: PATH_TO_PATHWAY[asString(a.discovery_path) ?? ""] ?? undefined,
  };

  // Non-schema raw context kept in session metadata (never invented into the profile).
  const metadata = {
    currentStatus: asString(a.current_status),
    preferredFormats: asArray(a.preferred_formats),
    additionalContext: asString(a.additional_context),
  };

  return { userProfile, metadata };
}
