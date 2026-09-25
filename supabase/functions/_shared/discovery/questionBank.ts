// Discovery question bank — the structured part of the interview (no AI cost).
// Sections follow discovery-flow.md steps 2–5 (user profile, market context,
// goals/capacity, business preferences). The pathway (step 3) is inferred from
// the answers by discovery-analyze, not asked directly.
// Pure module: no Deno/browser imports, so it is unit-testable.

export type QuestionType = "single" | "multi" | "text";
export interface Option { value: string; label: string; }
export interface Answer { choice?: string | string[]; other?: string; text?: string; }
export type Answers = Record<string, Answer | undefined>;

export interface Question {
  key: string;
  section: 1 | 2 | 3 | 4;
  text: string;
  why: string;
  type: QuestionType;
  options?: Option[];
  /** Adds an optional "In your own words" field; AI checkpoints review it. */
  allowOther: boolean;
  required: boolean;
  /** Branching: question shows only when this returns true. */
  showIf?: (a: Answers) => boolean;
}

export const SECTIONS: Record<number, { title: string; intro: string }> = {
  1: { title: "You", intro: "Your skills, experience and interests." },
  2: { title: "Who you can help", intro: "The people you understand and the problems they have." },
  3: { title: "Goals and capacity", intro: "What you want this to do for you, and what you can put in." },
  4: { title: "How you like to work", intro: "The kind of product and business that suits you." },
};

const o = (...labels: string[]): Option[] =>
  labels.map((label) => ({ value: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), label }));

const chose = (a: Answers, key: string, value: string) => {
  const c = a[key]?.choice;
  return Array.isArray(c) ? c.includes(value) : c === value;
};

export const QUESTIONS: Question[] = [
  // ---- Section 1: You
  { key: "work_now", section: 1, type: "single", required: true, allowOther: true,
    text: "What do you do for work right now?",
    why: "Your day-to-day work is often the fastest route to something people will pay for.",
    options: o("Employed full-time", "Employed part-time", "Self-employed / freelancer", "Business owner", "Student", "Between jobs", "Retired") },
  { key: "work_field", section: 1, type: "single", required: true, allowOther: true,
    text: "Which field is that in (or was it most recently)?",
    why: "Industry knowledge becomes product knowledge.",
    options: o("Finance / accounting", "Health / fitness", "Education / training", "Marketing / sales", "Tech / IT", "Creative / design / media", "Beauty / hospitality", "Trades / construction", "Admin / operations", "Other") },
  { key: "skills", section: 1, type: "multi", required: true, allowOther: true,
    text: "Which of these are you genuinely good at?",
    why: "We match products to real skills, not trends.",
    options: o("Explaining things simply", "Organising and planning", "Spreadsheets and numbers", "Writing", "Design and visuals", "Video and photos", "Selling and persuading", "Coaching and motivating", "Research", "Cooking / food", "Fitness", "Tech set-up and tools") },
  { key: "teach_afternoon", section: 1, type: "text", required: true, allowOther: false,
    text: "What could you teach a complete beginner in one afternoon?",
    why: "If you can teach it quickly, you can package it." },
  { key: "asked_for_help", section: 1, type: "multi", required: true, allowOther: true,
    text: "What do people regularly ask you for help with?",
    why: "Repeated requests are the strongest signal that people will pay.",
    options: o("Money and budgeting", "Career and CVs", "Health, fitness or food", "Business or side hustles", "Social media", "Tech and apps", "Relationships and parenting", "Studying and exams", "Home, DIY or style", "Nobody asks me yet") },
  { key: "experience_edge", section: 1, type: "single", required: true, allowOther: true,
    text: "How many years of experience do you have in your strongest area?",
    why: "Experience sets how advanced your product can be.",
    options: o("Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years") },
  { key: "interests", section: 1, type: "multi", required: true, allowOther: true,
    text: "Which topics could you talk about for hours?",
    why: "You'll create and market this for months — interest keeps you going.",
    options: o("Personal finance", "Business and entrepreneurship", "Health and fitness", "Food and cooking", "Beauty and fashion", "Parenting and family", "Personal growth", "Tech and AI", "Creativity and art", "Travel", "Faith and purpose", "Sport") },
  { key: "has_product", section: 1, type: "single", required: true, allowOther: false,
    text: "Do you already sell a product, course or service?",
    why: "If you do, we focus on improving and selling it rather than starting over.",
    options: o("No, starting from zero", "I have an idea but nothing built", "Yes, a digital product", "Yes, a service or coaching", "Yes, a physical product or business") },
  { key: "current_offer", section: 1, type: "text", required: true, allowOther: false,
    text: "Briefly, what do you sell today and how is it going?",
    why: "So we build on what works instead of replacing it.",
    showIf: (a) => chose(a, "has_product", "yes-a-digital-product") || chose(a, "has_product", "yes-a-service-or-coaching") || chose(a, "has_product", "yes-a-physical-product-or-business") },

  // ---- Section 2: Who you can help
  { key: "audiences", section: 2, type: "multi", required: true, allowOther: true,
    text: "Which groups of people do you understand best?",
    why: "The best products serve a specific group, not everyone.",
    options: o("Students", "Young professionals", "Parents", "Small business owners", "Freelancers / side hustlers", "Job seekers", "Women in their 30s–50s", "Creators / influencers", "Retirees", "People in my industry") },
  { key: "audience_where", section: 2, type: "multi", required: true, allowOther: true,
    text: "Where do those people spend time online?",
    why: "This decides where you'll market.",
    options: o("TikTok", "Instagram", "Facebook", "WhatsApp groups", "YouTube", "LinkedIn", "Pinterest", "X / Twitter", "Reddit / forums", "Email newsletters") },
  { key: "problem_main", section: 2, type: "text", required: true, allowOther: false,
    text: "What problem do they complain about most — in their own words?",
    why: "Products sell when they use the buyer's language." },
  { key: "problem_tried", section: 2, type: "multi", required: true, allowOther: true,
    text: "What have they already tried that didn't work?",
    why: "Knowing failed alternatives shows how to be different.",
    options: o("Free YouTube videos", "Generic courses", "Apps", "Books", "Hiring someone", "Asking friends", "Nothing yet", "Not sure") },
  { key: "result_wanted", section: 2, type: "text", required: true, allowOther: false,
    text: "What result would they happily pay for?",
    why: "People buy outcomes, not information." },
  { key: "problem_urgency", section: 2, type: "single", required: true, allowOther: false,
    text: "How urgent is this problem for them?",
    why: "Urgent problems sell faster and at better prices.",
    options: o("They'd pay to fix it this week", "Important but not urgent", "Nice to have", "Not sure") },
  { key: "audience_size", section: 2, type: "single", required: true, allowOther: true,
    text: "Do you have any audience today?",
    why: "An existing audience changes how you launch.",
    options: o("None yet", "Friends and family only", "Under 500 followers", "500–5,000 followers", "5,000+ followers", "An email list", "Existing clients or customers") },
  { key: "competitors", section: 2, type: "text", required: false, allowOther: false,
    text: "Which creators, brands or products do they already buy from? (optional)",
    why: "Existing buyers prove demand and show what to beat." },

  // ---- Section 3: Goals and capacity
  { key: "goal_type", section: 3, type: "single", required: true, allowOther: true,
    text: "What do you want this product to do for you?",
    why: "Your goal shapes the product and the price.",
    options: o("Side income", "Replace my salary", "Grow my personal brand", "Support my existing business", "Test an idea") },
  { key: "income_target", section: 3, type: "single", required: true, allowOther: false,
    text: "What monthly income from this would feel like a win in 6 months?",
    why: "This sets realistic volume and price — it's a target, not a promise.",
    options: o("Under $250", "$250–$1,000", "$1,000–$3,000", "$3,000–$10,000", "$10,000+") },
  { key: "hours_week", section: 3, type: "single", required: true, allowOther: false,
    text: "How many hours a week can you commit?",
    why: "We won't recommend something you don't have time to build.",
    options: o("Under 3 hours", "3–5 hours", "5–10 hours", "10–20 hours", "20+ hours") },
  { key: "launch_when", section: 3, type: "single", required: true, allowOther: false,
    text: "When would you like to launch?",
    why: "Timelines decide how big the first version can be.",
    options: o("Within 2 weeks", "Within a month", "In 1–3 months", "No rush") },
  { key: "budget", section: 3, type: "single", required: true, allowOther: false,
    text: "What can you spend to get started (tools, ads)?",
    why: "We'll recommend free tools first when budget is tight.",
    options: o("Nothing — free tools only", "Under $50", "$50–$200", "$200–$500", "$500+") },
  { key: "tech_comfort", section: 3, type: "single", required: true, allowOther: false,
    text: "How comfortable are you with new apps and technology?",
    why: "This decides how technical the build steps can be.",
    options: o("Beginner — keep it simple", "Comfortable with the basics", "Confident", "Advanced") },
  { key: "blockers", section: 3, type: "multi", required: true, allowOther: true,
    text: "What has stopped you before?",
    why: "The plan should design around your real obstacles.",
    options: o("Not knowing what to sell", "Not knowing where to start", "Time", "Money", "Confidence", "Tech", "Fear of being seen", "Starting but not finishing", "Nothing — I'm new to this") },

  // ---- Section 4: How you like to work
  { key: "brand_style", section: 4, type: "single", required: true, allowOther: false,
    text: "Do you want to show your face?",
    why: "Faceless businesses work — they just market differently.",
    options: o("Yes, personal brand", "No, faceless", "Either", "Undecided") },
  { key: "complexity", section: 4, type: "single", required: true, allowOther: false,
    text: "What size should your first product be?",
    why: "A simple first product usually launches faster.",
    options: o("Simple — launch fast", "Medium — a few weeks of work", "Big — a full program") },
  { key: "price_range", section: 4, type: "single", required: true, allowOther: false,
    text: "What price range are you comfortable selling at?",
    why: "Price affects how many sales you need and how you market.",
    options: o("Under $20", "$20–$50", "$50–$150", "$150–$500", "No preference") },
  { key: "formats", section: 4, type: "multi", required: true, allowOther: true,
    text: "Which formats would you enjoy creating?",
    why: "You'll finish a format you enjoy.",
    options: o("Guide or ebook", "Templates", "Spreadsheet or planner", "Checklists", "Notion system", "Video course", "Workshop", "Prompt pack", "Community or membership") },
  { key: "sell_model", section: 4, type: "single", required: true, allowOther: false,
    text: "Would you rather sell something once, or build something ongoing?",
    why: "One-time products are simpler; memberships need ongoing work.",
    options: o("Sell once", "Ongoing / membership", "Both over time", "Not sure") },
  { key: "wont_do", section: 4, type: "multi", required: false, allowOther: true,
    text: "Is there anything you won't do?",
    why: "We'll never build a plan around something you refuse to do.",
    options: o("Live calls", "Video", "Selling in DMs", "Paid ads", "Posting daily", "Nothing") },
];

/** Checkpoints fire after these sections are complete (AI asks 3–5 follow-ups). */
export const CHECKPOINTS: { id: "cp1" | "cp2"; afterSection: 2 | 4 }[] = [
  { id: "cp1", afterSection: 2 },
  { id: "cp2", afterSection: 4 },
];

export const visibleQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));

export function isAnswered(q: Question, ans: Answer | undefined): boolean {
  if (!ans) return false;
  if (q.type === "text") return typeof ans.text === "string" && ans.text.trim().length > 0;
  const c = ans.choice;
  const hasChoice = Array.isArray(c) ? c.length > 0 : typeof c === "string" && c.length > 0;
  return hasChoice || (q.allowOther && typeof ans.other === "string" && ans.other.trim().length > 0);
}

/** Validates an answer against the question; returns an error code or null. */
export function validateAnswer(q: { type: QuestionType; options?: Option[]; allowOther?: boolean }, ans: unknown): string | null {
  if (!ans || typeof ans !== "object") return "invalid_answer";
  const a = ans as Answer;
  const tooLong = (s?: string) => typeof s === "string" && s.length > 1500;
  if (tooLong(a.text) || tooLong(a.other)) return "answer_too_long";
  if (q.type === "text") return typeof a.text === "string" && a.text.trim() ? null : "text_required";
  const allowed = new Set((q.options ?? []).map((x) => x.value));
  const picks = a.choice === undefined ? [] : Array.isArray(a.choice) ? a.choice : [a.choice];
  if (q.type === "single" && picks.length > 1) return "single_choice_only";
  if (picks.some((p) => typeof p !== "string" || !allowed.has(p))) return "unknown_option";
  if (picks.length === 0 && !(q.allowOther && typeof a.other === "string" && a.other.trim())) return "choice_required";
  return null;
}

/** Human-readable Q/A line for the AI (labels, not slugs; own words flagged). */
export function describe(q: { text: string; options?: Option[] }, a: Answer): string {
  const label = (v: string) => q.options?.find((x) => x.value === v)?.label ?? v;
  const parts: string[] = [];
  if (a.choice !== undefined) parts.push((Array.isArray(a.choice) ? a.choice : [a.choice]).map(label).join("; "));
  if (a.text) parts.push(a.text);
  if (a.other) parts.push(`[in their own words] ${a.other}`);
  return `Q: ${q.text}\nA: ${parts.join(" | ") || "(skipped)"}`;
}

/** Readable transcript for the AI from stored answer rows (bank, follow-ups, legacy). */
export function transcript(
  rows: { question_key: string; question_text?: string | null; answer: unknown }[],
  followups: { key: string; text: string; options?: Option[] }[] = [],
): string {
  return rows.map((r) => {
    const def = QUESTIONS.find((q) => q.key === r.question_key)
      ?? followups.find((f) => f.key === r.question_key)
      ?? { text: r.question_text ?? r.question_key };
    const raw = r.answer;
    const a: Answer = typeof raw === "string" ? { text: raw }
      : raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Answer
      : { text: JSON.stringify(raw) };
    return describe(def, a);
  }).join("\n\n");
}
