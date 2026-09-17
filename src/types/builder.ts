/** Explicit states for the Discovery -> Blueprint -> Paywall -> Builder journey. */
export type BuilderFlowState =
  | "discovery-complete"
  | "opportunity-selected"
  | "blueprint-generating"
  | "blueprint-generated"
  | "paywall"
  | "payment-pending"
  | "payment-confirmed"
  | "builder-unlocked";
