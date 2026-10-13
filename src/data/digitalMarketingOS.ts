/**
 * Digital Marketing OS — product metadata + the 12-module curriculum.
 * Content is condensed from the Business-in-a-Box kit's 20 operating files
 * (strategy through resource directories), restructured as a buyer-facing
 * course. File 21 (AI Workforce upsell) is deliberately excluded — that's
 * Master Workforce's funnel, not this product.
 */

export interface DmosModule {
  id: string;
  number: number;
  title: string;
  outcome: string;
  lessons: { title: string; body: string }[];
}

export const DMOS_PRODUCT = {
  key: "digital-marketing-os" as const,
  name: "369 Digital Marketing OS",
  tagline: "An evidence-based operating system for marketing a digital product: strategy, platforms, content, funnels and measurement.",
  price: 197,
  compareAtPrice: 247,
  moduleCount: 12,
};

export const DMOS_MODULES: DmosModule[] = [
  {
    id: "strategy-and-offer",
    number: 1,
    title: "Strategy & Offer",
    outcome: "Pick one niche and one product concept you can defend with evidence, not enthusiasm.",
    lessons: [
      {
        title: "What a digital product actually is",
        body: "Nine common formats (ebooks, templates, courses, workbooks, prompt packs, checklists, toolkits, memberships, licensed assets), their real advantages (no inventory, infinite margin, sellable while you sleep) and disadvantages (easy to copy, price-sensitive, discoverability is hard without an audience). Three ways to build: from scratch, AI-accelerated (this OS's default mode), or licensed assets — each with a different ownership/effort tradeoff.",
      },
      {
        title: "The Opportunity Finder",
        body: "A ready-to-run research prompt: feed it your niche, target customer, their problem, skill level, existing solutions, your available expertise, budget and time — it returns 10 product ideas, each with target customer, problem, format, named competitors, differentiation angle, price band, acquisition strategy, build difficulty and a validation method. Rule: it must cite real evidence or flag 'ASSUMPTION, NOT VERIFIED' — demand is never invented.",
      },
      {
        title: "The Niche Scorecard",
        body: "Score any niche 1–10 across 12 factors (demand, problem intensity, purchasing power, competition, accessibility, your expertise, content potential, product potential, repeat purchase, upsell potential, growth trend, personal interest) for a total out of 120. Decision tree: 85+ enter the niche, 65–84 research further, 45–64 modify, below 45 abandon and re-run the Opportunity Finder.",
      },
      {
        title: "Real customer problem research",
        body: "A research agent that only reports problems it can find evidence for — Reddit threads, YouTube/TikTok comments, forums, product reviews, competitor refund complaints. For each: the problem in the customer's own words, frequency, severity, existing workaround, existing paid solution, emotional and financial impact, desired outcome.",
      },
      {
        title: "Validating before you build",
        body: "The Validation Scorecard (evidence, demand signal, competition — a good sign — urgency, willingness to pay, reachability, feasibility) paired with six validation methods ordered cheapest to most rigorous: search validation, competitor validation, a 15–20 person survey, a landing-page test, pre-sale, and short interviews. One rule that matters more than the rest: a validated $9 problem beats an unvalidated $99 solution.",
      },
    ],
  },
  {
    id: "operating-system",
    number: 2,
    title: "Your AI Operating System",
    outcome: "Run the whole business through one coordinator and a library of specialist agents, instead of rebuilding your process from scratch every session.",
    lessons: [
      {
        title: "The Chief of Staff",
        body: "One prompt that sits at the start of every working session. It asks one clarifying question if your stage is unclear, routes you to the right agent or SOP with the prompt already filled in from what you've told it, tracks open loops, and pushes back exactly once if you're skipping validation to jump straight to building — then respects your call.",
      },
      {
        title: "The 15-agent library",
        body: "Market Researcher, Niche Analyst, Customer Researcher, Competitor Researcher, Product Strategist, Product Builder, Offer Strategist, Copywriter, Sales Page Builder, Content Strategist, Content Writer, Visual Director, Video Director, Email Marketer, Customer Support Agent, Analytics Agent, Optimization Agent — each with a fixed structure: role, mission, objective, inputs, process, output, rules, constraints, QA check and handoff to the next agent.",
      },
      {
        title: "Why the handoff chain matters",
        body: "No agent freelances past its lane. Market Researcher hands ranked ideas to Niche Analyst, who hands a committed niche to Customer Researcher, who hands documented pain to Product Strategist — all the way through to Optimization Agent, which loops back to Product Builder for a V2. Following the chain is what keeps the system from degrading into generic advice.",
      },
    ],
  },
  {
    id: "sops-and-systems",
    number: 3,
    title: "SOPs & Systemization",
    outcome: "Turn every stage of the business into a repeatable, QA'd procedure instead of a one-off judgment call.",
    lessons: [
      {
        title: "The 14-SOP backbone",
        body: "Choosing a niche → finding customer problems → validating → creating the product → creating templates → creating the offer → building the sales page → setting up checkout → setting up delivery → creating content → launching → collecting feedback → improving → creating V2. Each SOP states its objective, inputs, tools, numbered steps, expected output, a QA check, common mistakes, and where to go when it's not working.",
      },
      {
        title: "Common failure modes, by SOP",
        body: "The patterns that recur: picking a niche on gut feel instead of the scorecard; treating one loud complaint as a trend; skipping straight to building because you're excited; padding a product's length instead of cutting to the core promise; fake scarcity and guarantees you can't honor; leading a sales page with features instead of the problem; not personally test-purchasing your own checkout before launch.",
      },
    ],
  },
  {
    id: "templates-and-worksheets",
    number: 4,
    title: "Templates & Worksheets",
    outcome: "Never start a deliverable from a blank page — fill in brackets instead.",
    lessons: [
      {
        title: "The deliverable templates",
        body: "Customer Research Log, Competitor Research Log, Product Brief, Product Outline, Offer Stack, Sales Page Skeleton, Email Sequence Skeleton, DM Outreach, Content Calendar Row, Content Brief, Launch Calendar Row — copy-paste structures for every artifact the business produces.",
      },
      {
        title: "The relationship templates",
        body: "Post-purchase Customer Survey, Testimonial Request, Affiliate Invitation, Refund Response, and a general Customer Support reply template — the conversations that happen after the sale, drafted once so you're never improvising a refund response while frustrated.",
      },
      {
        title: "The scorecards",
        body: "Full versions of the Niche Scorecard (12 factors /120) and Product Validation Scorecard (7 factors /70), plus a Tool-Stack Builder intake (country, budget, product type, technical skill, current tools, desired automation) and a Reference Intake Template for turning any source document into something an agent can use.",
      },
    ],
  },
  {
    id: "qa-and-checklists",
    number: 5,
    title: "QA & Checklists",
    outcome: "Know exactly what 'done' looks like at every stage, so nothing ships half-finished.",
    lessons: [
      {
        title: "Stage-by-stage checklists",
        body: "Idea selection, validation, product creation, offer creation, sales page, checkout, delivery, content, launch, customer onboarding, analytics, optimization — one checklist per stage, each a short list of concrete, checkable conditions rather than vague advice.",
      },
      {
        title: "The product QA bar",
        body: "Every section of your product must answer four questions: what do I do, how do I do it, what tool do I use, how do I know it worked. No filler pages. And the test that decides if it's actually done: would a buyer feel like they got a system, not a PDF?",
      },
    ],
  },
  {
    id: "platform-setup",
    number: 6,
    title: "Platform Setup",
    outcome: "Get a real product uploaded, priced, and able to accept a payment — on the platform that actually fits a South-Africa-based seller going global.",
    lessons: [
      {
        title: "Gumroad, Payhip, Lemon Squeezy — compared",
        body: "Fee model, monthly cost, payout cadence and notes for all three entry-level platforms. All current figures are flagged VERIFY BEFORE PUBLISHING in the source material — platform pricing moves, so the OS teaches you where to check rather than a number that will go stale.",
      },
      {
        title: "Why Merchant-of-Record fits a South African seller",
        body: "Stripe doesn't onboard South African-registered businesses directly — it needs a foreign (US/UK) entity. Payhip and Lemon Squeezy act as Merchant of Record: they handle global VAT/sales tax compliance and payout to you without you needing your own Stripe account. That's the practical starting point, not a workaround.",
      },
      {
        title: "Step-by-step setup",
        body: "Create product → upload files → configure checkout → configure the confirmation/thank-you message → configure delivery → configure customer re-access → test-purchase with a real card → test delivery on mobile → test the refund flow. Walkthroughs given per platform.",
      },
      {
        title: "The Customer Delivery Checklist",
        body: "Files open without corruption, confirmation email arrives within 2 minutes and doesn't land in spam, files/links work on mobile, the customer has a way to re-access the product later, and the refund flow has been tested end to end — before you call delivery 'done'.",
      },
    ],
  },
  {
    id: "payments-and-psps",
    number: 7,
    title: "Payments & PSPs",
    outcome: "Choose the right payment processor for your situation without guessing at fees or country support.",
    lessons: [
      {
        title: "The payment landscape",
        body: "Stripe (best developer experience, not directly available to SA-registered businesses), PayPal (available in SA, wider reach, weaker subscription tooling), Merchant-of-Record platforms (handle global tax compliance for you), and Paystack (Africa-focused, good for serving South African customers directly with local payment methods).",
      },
      {
        title: "Decision trees",
        body: "Which PSP should I use (based on whether you have a foreign entity), which PSP works in my country, marketplace vs. your own checkout (fee vs. discovery trade-off), one-time vs. recurring billing (your entry product is one-time; a later membership or retainer tier needs real subscription billing).",
      },
      {
        title: "The one rule that protects you",
        body: "Never quote a specific fee percentage, country-availability claim, or payout timeline to a customer or in marketing copy without checking the platform's current official page first. These change without much notice, and a wrong number in customer-facing copy is a trust problem, not a typo.",
      },
    ],
  },
  {
    id: "ai-reference-system",
    number: 8,
    title: "AI Reference System",
    outcome: "Turn any of the 15 generic agents into a specialist for your exact niche in minutes, without rewriting the agent.",
    lessons: [
      {
        title: "The specialization formula",
        body: "Base Agent + Specialized References + Instructions + Examples + Output Format + QA = Specialized Agent. You don't rewrite the agent — you swap the Instructions (what to do, specific to this niche), Knowledge (terminology, buyer psychology), References (what to consult first), Examples (what excellent output looks like here) and Constraints (what it must never do).",
      },
      {
        title: "The Reference Intake Template",
        body: "Source, title, author/company, date, URL, why it matters, what the agent should extract, which agent should use it, priority, and an expiry/review date — so your references stay current instead of quietly going stale.",
      },
      {
        title: "Verified fact vs. inference vs. assumption",
        body: "Every agent should distinguish a verified fact (you confirmed it directly), an inference (reasonable but not confirmed), a recommendation (the agent's judgment call), and an assumption (unconfirmed — must be labeled VERIFY BEFORE PUBLISHING). Any specific number, price or claim without a direct source carries that flag until checked.",
      },
    ],
  },
  {
    id: "content-engine",
    number: 9,
    title: "Content Engine",
    outcome: "Build the audience that will actually buy, on a cadence you can sustain.",
    lessons: [
      {
        title: "Platforms and cadence",
        body: "TikTok, Instagram, YouTube, LinkedIn, X, Facebook, and Reddit where a subreddit's rules allow it. Daily: one value or story piece on your primary platform. Weekly: one deeper piece (long-form video, carousel breakdown, written thread) plus a lead-magnet push.",
      },
      {
        title: "CTA and lead-magnet strategy",
        body: "Rotate follow/save CTAs (top-of-funnel) with offer-link CTAs (bottom-of-funnel) — never sell in every post. Lead magnets are a free, narrow asset that solves one small piece of the bigger problem, delivered via DM automation or email opt-in, then nurtured toward the paid offer over a 5–7 day welcome sequence.",
      },
      {
        title: "Faceless vs. personal brand",
        body: "Faceless (screen recordings, AI voice, text overlays, AI visuals) scales easily but builds trust slower. Personal brand (talking head, storytelling) builds trust and differentiation faster but is more time-intensive and ties the brand to you. Mixing both gets you faceless reach plus personal-brand trust.",
      },
    ],
  },
  {
    id: "sales-and-launch",
    number: 10,
    title: "Sales & Launch System",
    outcome: "Run a real launch sequence and an affiliate program, with sales messaging you can defend.",
    lessons: [
      {
        title: "The product ladder",
        body: "Free lead magnet → entry product → upgrade tier → done-with-you implementation → premium done-for-you — an entry price point exists to prove value cheaply and build a buyer list, because people who've paid you once are far more likely to buy again.",
      },
      {
        title: "The launch sequence",
        body: "Pre-launch (tease the problem, open a waitlist, warm your list) → launch day (announcement across active platforms, email to the waitlist, personal DMs to recently engaged people) → launch week (objection-handling content, real testimonials if you have them, honest urgency reminders) → post-launch (recap content, move into feedback collection).",
      },
      {
        title: "Affiliates, done honestly",
        body: "Use your platform's native tracking rather than building your own. A realistic commission range for a sub-$50 digital product is 30–50%. Commission reverses on a refund — state that upfront. Affiliates disclose the relationship per FTC/local advertising standards.",
      },
      {
        title: "The sales messaging line you don't cross",
        body: "No deceptive scarcity on an unlimited digital product. No fake countdown timers unless the price genuinely changes at that time. No fabricated testimonials or results. Every claim must be defensible if a customer challenges it directly.",
      },
    ],
  },
  {
    id: "30-day-plan",
    number: 11,
    title: "The 30-Day Execution Plan",
    outcome: "A specific task for every day from idea to launch — so 'I should build a digital product' turns into a schedule.",
    lessons: [
      {
        title: "Days 1–15: research through sales assets",
        body: "Days 1–3 research and score niches; days 4–5 choose and validate the opportunity; days 6–10 build the product and its supporting templates, then QA it; days 11–12 build the offer; days 13–15 draft copy and build the sales page.",
      },
      {
        title: "Days 16–30: payments through optimization",
        body: "Days 16–18 set up payment, delivery and the refund flow; days 19–23 build and queue the first week of content plus the launch email sequence; days 24–26 run the launch; days 27–30 pull real numbers, collect buyer feedback, and ship the single highest-impact fix.",
      },
    ],
  },
  {
    id: "troubleshooting-and-resources",
    number: 12,
    title: "Troubleshooting & Resource Directories",
    outcome: "Diagnose what's actually broken when something isn't converting, and know where to find tools, marketplaces and legitimate licensed assets.",
    lessons: [
      {
        title: "Decision trees for what's not working",
        body: "Traffic but no sales, sales but high refunds, low checkout conversion, low content engagement, low email conversion, and high acquisition costs — each with a short diagnostic sequence rather than generic 'improve your marketing' advice.",
      },
      {
        title: "Creative tool directory",
        body: "AI image generation (Midjourney, Ideogram, Adobe Firefly, Leonardo, Canva, Stable Diffusion) and AI video (Veo, Runway, Kling, Pika, HeyGen, Synthesia, CapCut, Descript, ElevenLabs), matched to use case — which tool fits faceless voiceover content vs. talking-head-without-being-on-camera vs. sales page visuals.",
      },
      {
        title: "Where to sell and where to outsource",
        body: "Marketplace vs. own-store tradeoffs (discovery vs. fee and audience ownership), a reference list of where digital products get sold, and where to responsibly outsource fulfillment (Upwork, Fiverr, Freelancer.com) with the IP-ownership and scope-control basics covered.",
      },
      {
        title: "Using licensed assets without the legal risk",
        body: "What to check before using any PLR, commercial-use template, or licensed asset: license type, commercial rights, modification rights, branding rights, resale rights, distribution restrictions, attribution requirements. The rule that overrides everything else — never assume an asset can be resold, modified, or rebranded without reading the actual license yourself.",
      },
    ],
  },
];
