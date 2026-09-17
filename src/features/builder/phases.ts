/**
 * Builder phase definitions (UI-facing). Phase ids use the DOCUMENTED
 * terminology matching products.current_phase. Each answers the three questions
 * the product must always answer: what is this / why it matters / what to do next.
 */
import type { BuilderPhase } from "./builderTypes";

export interface PhaseDef {
  id: BuilderPhase;
  label: string;
  what: string;      // WHAT IS THIS?
  why: string;       // WHY DOES IT MATTER?
  next: string;      // WHAT DO I DO NEXT?
}

export const BUILDER_PHASES: PhaseDef[] = [
  { id: "strategy", label: "Strategy",
    what: "Lock in the core of your product from your blueprint — concept, buyer, problem, outcome, format, positioning and pricing direction.",
    why: "Everything after this builds on a clear foundation. Skipping it means guessing later.",
    next: "Confirm the essentials and note any gaps, then generate your strategy summary." },
  { id: "customer", label: "Customer",
    what: "Get sharp on exactly who this is for — their problem, motivation, objections, desired transformation and the words they use.",
    why: "The clearer the customer, the easier every piece of copy and content becomes.",
    next: "Describe your customer in your words; the guide sharpens it into a reusable profile." },
  { id: "offer", label: "Offer",
    what: "Turn the product into an offer: core promise, deliverables, pricing, optional bonuses, objection handling and CTA.",
    why: "People buy offers, not products. This is where value becomes a decision.",
    next: "Set your promise and price direction, then generate the offer." },
  { id: "creation", label: "Product Creation",
    what: "A concrete plan to actually build the product for your format — structure, modules, content instructions, prompts and a workflow.",
    why: "This is where the product gets made, not just planned.",
    next: "Generate the creation plan, then work through it. Tool suggestions appear here." },
  { id: "brand", label: "Positioning & Brand",
    what: "Establish positioning, differentiation and your brand voice — personal brand or faceless.",
    why: "Positioning decides whether you stand out or blend in.",
    next: "Confirm your brand preference and generate your positioning." },
  { id: "landing", label: "Landing Page",
    what: "All the landing-page pieces: headline, subheadline, problem, solution, benefits, contents, objections, CTA and FAQ.",
    why: "This is what converts a visitor into a buyer.",
    next: "Generate the landing-page components from your real product context." },
  { id: "payment", label: "Payment & Checkout",
    what: "Choose how you'll take payment and deliver the product — checkout platform, delivery mechanism and pricing setup.",
    why: "No checkout, no sales. This makes the product buyable.",
    next: "Pick your direction and generate a setup plan." },
  { id: "content", label: "Marketing & Content",
    what: "A practical marketing plan (what to post, why, where, how, when, which CTA, what to measure) plus a content foundation.",
    why: "This is how people find the product. Specific beats 'post consistently'.",
    next: "Generate your marketing plan and starter content." },
  { id: "launch", label: "Launch",
    what: "Finalize the product and run a clear launch sequence with first-customer actions.",
    why: "A launch turns a finished product into actual sales activity.",
    next: "Generate your launch sequence and work the checklist." },
  { id: "optimization", label: "Next Steps",
    what: "Your completed product, a launch checklist, remaining actions and the recommended next step.",
    why: "Momentum after launch is what compounds.",
    next: "Review your checklist and next actions." },
];

export const PHASE_BY_ID: Record<BuilderPhase, PhaseDef> =
  Object.fromEntries(BUILDER_PHASES.map((p) => [p.id, p])) as Record<BuilderPhase, PhaseDef>;
