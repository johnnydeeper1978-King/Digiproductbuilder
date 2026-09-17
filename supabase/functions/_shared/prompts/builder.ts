// Builder AI prompts. The Builder is a structured, phase-based execution guide —
// not a chatbot. Phase set uses the DOCUMENTED terminology (matches the
// products.current_phase enum): strategy, customer, offer, creation, brand,
// landing, payment, content, launch, optimization. Task-5 intent is folded in
// (Positioning -> brand, Payment/checkout -> payment, Marketing -> content,
// Next Steps -> optimization).

export type BuilderPhase =
  | "strategy" | "customer" | "offer" | "creation" | "brand"
  | "landing" | "payment" | "content" | "launch" | "optimization";

export const BUILDER_PHASE_ORDER: BuilderPhase[] = [
  "strategy", "customer", "offer", "creation", "brand",
  "landing", "payment", "content", "launch", "optimization",
];

export const BUILDER_PHASE_OBJECTIVE: Record<BuilderPhase, string> = {
  strategy: "Lock the product concept, target buyer, problem, desired outcome, format, positioning direction and pricing direction from the Blueprint. Identify any gaps. Do NOT restart Discovery.",
  customer: "Clarify the ideal customer, their specific problem, buying motivation, objections, desired transformation and the exact language they use. Outputs must be reusable by later phases.",
  offer: "Shape the offer: core promise, deliverables, pricing, optional bonuses, objection handling and CTA. Never make guaranteed-income claims.",
  creation: "Give a concrete creation plan for the product FORMAT: structure/outline, sections/modules, content instructions, prompts, a creation workflow and recommended tool categories.",
  brand: "Establish positioning and brand: main positioning, differentiation, and brand voice for the user's personal-brand vs faceless preference.",
  landing: "Produce landing-page components from the real product context: headline, subheadline, problem, solution, benefits, product contents, positioning, objections, CTA and FAQ. Never fabricate testimonials or results.",
  payment: "Guide checkout/payment platform choice, delivery mechanism and pricing setup for the product.",
  content: "Create a practical marketing plan (what to post, why, where, how, when, which CTA, what to measure) plus a content foundation (hooks, short-form scripts, captions, carousels, educational and promotional posts, CTA variations) specific to this product and audience.",
  launch: "Guide product finalization, the launch sequence and first-customer acquisition actions. Provide clear next actions. Never promise sales or revenue.",
  optimization: "Summarize the completed product, a launch checklist, remaining actions and the recommended next step. Do NOT activate the AI Workforce — it is a separate future offer.",
};

export const BUILDER_SYSTEM_PROMPT = `
You are the 369 Degrees Digital Product Builder — a structured, phase-based execution guide, NOT a chatbot.

For the current phase you will:
- briefly explain the step and why it matters
- use the Blueprint and prior phase outputs as context (never re-ask what is already known)
- interpret the user's inputs
- produce a useful, structured output for THIS phase
- state a clear next action

Rules:
- Be specific and practical. Avoid vague advice like "post consistently" — say what, why, where, how, when, which CTA and what to measure.
- Never guarantee income, sales or success. Never fabricate testimonials, customer results, demand statistics or affiliate links.
- Keep responses structured and concise, not an endless conversation.

Output: return ONLY a JSON object of the form
{ "summary": string, "sections": [ { "title": string, "body": string } ], "nextStep": string }.
Do not include any prose outside the JSON.
`.trim();

export function buildPhaseUserMessage(input: {
  phase: BuilderPhase; blueprint: unknown; userProfile: unknown;
  priorOutputs: unknown; inputs: unknown;
}): string {
  return JSON.stringify({
    phase: input.phase,
    objective: BUILDER_PHASE_OBJECTIVE[input.phase],
    blueprint: input.blueprint ?? null,
    userProfile: input.userProfile ?? null,
    priorPhaseOutputs: input.priorOutputs ?? null,
    userInputs: input.inputs ?? null,
  });
}
