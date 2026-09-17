/**
 * TypeScript mirror of schemas/discovery-output.schema.json.
 * The JSON Schema is the source of truth — keep these in sync.
 */
import type { UserProfile } from "./user-profile";
import type { Opportunity } from "./opportunity";
import type { Blueprint } from "./blueprint";

export type DiscoveryStatus =
  | "in-progress"
  | "opportunities-generated"
  | "opportunity-selected"
  | "blueprint-generated"
  | "complete";

export interface DiscoveryOutput {
  sessionId?: string;
  generatedAt?: string;
  status?: DiscoveryStatus;
  userProfile: UserProfile;
  productOpportunities?: Opportunity[];
  unexpectedOpportunities?: Opportunity[];
  selectedOpportunity?: Opportunity;
  blueprint?: Blueprint;
}
