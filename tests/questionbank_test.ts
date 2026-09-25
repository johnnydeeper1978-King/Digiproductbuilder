import { QUESTIONS, visibleQuestions, validateAnswer, isAnswered, transcript } from "../supabase/functions/_shared/discovery/questionBank.ts";
const assert = (c: boolean, m: string) => { if (!c) throw new Error(m); };
Deno.test("29 questions by default, 30 when they already sell", () => {
  assert(visibleQuestions({}).length === 29, "default " + visibleQuestions({}).length);
  assert(visibleQuestions({ has_product: { choice: "yes-a-digital-product" } }).length === 30, "branch");
  const per = [1, 2, 3, 4].map((s) => QUESTIONS.filter((q) => q.section === s).length);
  assert(per.join() === "9,8,7,6", "sections " + per.join());
});
Deno.test("keys unique, choice questions have options", () => {
  assert(new Set(QUESTIONS.map((q) => q.key)).size === QUESTIONS.length, "dup keys");
  for (const q of QUESTIONS) if (q.type !== "text") assert((q.options?.length ?? 0) >= 3, q.key);
});
Deno.test("answer validation", () => {
  const skills = QUESTIONS.find((q) => q.key === "skills")!;
  const single = QUESTIONS.find((q) => q.key === "hours_week")!;
  const text = QUESTIONS.find((q) => q.key === "problem_main")!;
  assert(validateAnswer(skills, { choice: ["writing", "research"] }) === null, "multi ok");
  assert(validateAnswer(skills, { other: "Bookkeeping" }) === null, "other-only ok");
  assert(validateAnswer(skills, { choice: ["hacking"] }) === "unknown_option", "bad option");
  assert(validateAnswer(single, { choice: ["3-5-hours", "5-10-hours"] }) === "single_choice_only", "single");
  assert(validateAnswer(single, { other: "x" }) === "choice_required", "no other on single w/o allowOther");
  assert(validateAnswer(text, { text: "   " }) === "text_required", "blank text");
  assert(isAnswered(skills, { other: "Bookkeeping" }), "isAnswered other");
});
Deno.test("transcript uses labels and flags own words", () => {
  const t = transcript([{ question_key: "hours_week", answer: { choice: "5-10-hours", other: "weekends mostly" } }, { question_key: "legacy", question_text: "Old Q", answer: "old answer" }]);
  assert(t.includes("5–10 hours") && t.includes("[in their own words] weekends mostly") && t.includes("old answer"), t);
});
