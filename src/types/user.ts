/** Account roles the architecture must support. Authorization is enforced
 *  server-side (RLS / edge functions) — never trusted from the client. */
export type UserRole =
  | "free"
  | "builder_customer"
  | "workforce_lead"
  | "workforce_customer"
  | "coaching_customer"
  | "affiliate"
  | "admin";
