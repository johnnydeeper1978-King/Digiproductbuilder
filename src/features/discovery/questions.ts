/**
 * Discovery question set — FAITHFUL to the documented flow (discovery-flow.md,
 * the Discovery AI Agent prompt, discovery-rules.md) and mapped to
 * user-profile.schema.json. No questions were invented to fill space; each maps
 * to a documented profile dimension. Adaptive AI follow-ups (per the spec) are
 * handled server-side by the Discovery AI, not hard-coded here.
 */
import type { Question } from "./types";

export const DISCOVERY_QUESTIONS: Question[] = [
  {
    key: "current_status", step: 1, type: "single-select", required: true,
    title: "What best describes you right now?",
    help: "This just helps frame your options — none of these limits what you can build.",
    options: [
      { value: "employed", label: "Working a 9–5" },
      { value: "student", label: "Student" },
      { value: "between-jobs", label: "Between jobs" },
      { value: "personal-brand", label: "Building a personal brand" },
      { value: "business-owner", label: "Running a business" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    key: "discovery_path", step: 1, type: "single-select", required: true,
    title: "How would you like to start?",
    help: "There's no wrong answer — we can explore more than one direction later.",
    options: [
      { value: "know", label: "Something I know" },
      { value: "interested", label: "Something I'm interested in" },
      { value: "opportunity", label: "Find me an opportunity" },
      { value: "decide", label: "Help me decide" },
    ],
  },
  {
    key: "primary_goals", step: 1, type: "multi-select", required: true,
    title: "What's your main goal?",
    options: [
      { value: "side-income", label: "Extra income on the side" },
      { value: "replace-income", label: "Replace my income" },
      { value: "build-audience", label: "Build an audience" },
      { value: "first-product", label: "Launch a first product" },
      { value: "learn", label: "Learn the process" },
    ],
  },
  {
    key: "weekly_time", step: 1, type: "single-select", required: true,
    title: "How much time can you realistically commit each week?",
    options: [
      { value: "under-5", label: "Under 5 hours" },
      { value: "5-10", label: "5–10 hours" },
      { value: "10-20", label: "10–20 hours" },
      { value: "20-plus", label: "20+ hours" },
      { value: "varies", label: "It varies" },
    ],
  },
  {
    key: "skills", step: 2, type: "tags", required: true,
    title: "What are you good at, or what do people ask your help with?",
    help: "A few words each. Skills, know-how, or things friends come to you for.",
    placeholder: "e.g. spreadsheets, editing, cooking on a budget",
  },
  {
    key: "experience", step: 2, type: "tags", required: false,
    title: "Any relevant experience or industries you've worked in?",
    placeholder: "e.g. hospitality, teaching, retail",
  },
  {
    key: "interests", step: 2, type: "tags", required: true,
    title: "What topics or interests could you happily work on for months?",
    placeholder: "e.g. home fitness, personal finance, houseplants",
  },
  {
    key: "solved_problems", step: 3, type: "tags", required: false,
    title: "Any problems you've solved for yourself or others?",
    help: "Problems you understand well often make the strongest products.",
    placeholder: "e.g. getting fit on shift work, saving on groceries",
  },
  {
    key: "markets_of_interest", step: 3, type: "tags", required: false,
    title: "Any audiences or niches you're drawn to?",
    placeholder: "e.g. new parents, small gym owners, freelancers",
  },
  {
    key: "brand_type", step: 4, type: "single-select", required: true,
    title: "How do you want to show up?",
    options: [
      { value: "personal-brand", label: "As a personal brand" },
      { value: "faceless", label: "Faceless / behind the scenes" },
      { value: "either", label: "Either is fine" },
      { value: "undecided", label: "Not sure yet" },
    ],
  },
  {
    key: "complexity", step: 5, type: "single-select", required: true,
    title: "How simple should your first product be?",
    options: [
      { value: "simple", label: "As simple as possible" },
      { value: "moderate", label: "A balance" },
      { value: "complex", label: "I don't mind something complex" },
    ],
  },
  {
    key: "price_preference", step: 5, type: "single-select", required: true,
    title: "Where should it sit on price?",
    options: [
      { value: "low", label: "Low-cost / impulse buy" },
      { value: "mid", label: "Mid-priced" },
      { value: "premium", label: "Premium" },
      { value: "no-preference", label: "No preference" },
    ],
  },
  {
    key: "preferred_formats", step: 5, type: "multi-select", required: false,
    title: "Any product formats you'd prefer?",
    help: "Optional — the guide can also suggest the best format for you.",
    options: [
      { value: "ebook", label: "Ebook / guide" },
      { value: "template", label: "Template" },
      { value: "spreadsheet", label: "Spreadsheet" },
      { value: "checklist", label: "Checklist" },
      { value: "notion-system", label: "Notion system" },
      { value: "course", label: "Course" },
      { value: "toolkit", label: "Toolkit" },
      { value: "planner", label: "Planner" },
    ],
  },
  {
    key: "additional_context", step: 5, type: "text", required: false,
    title: "Anything else we should know?",
    placeholder: "Optional — anything that might shape the right opportunity for you.",
  },
];

export const DISCOVERY_STEP_LABELS: Record<number, string> = {
  1: "About you",
  2: "Skills & interests",
  3: "Problems & markets",
  4: "Brand",
  5: "Preferences",
};
