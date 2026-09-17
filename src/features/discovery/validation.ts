/** Pure answer validation against the question definitions. Unit-tested. */
import type { Question, AnswerMap, AnswerValue } from "./types";

export interface FieldError { key: string; message: string; }

function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  return v.length === 0;
}

/** Validate a single answer's shape for its question. Returns an error or null. */
export function validateAnswer(q: Question, value: AnswerValue | undefined): FieldError | null {
  if (isEmpty(value)) {
    return q.required ? { key: q.key, message: "This one's required." } : null;
  }
  if ((q.type === "single-select") && typeof value !== "string") {
    return { key: q.key, message: "Pick one option." };
  }
  if ((q.type === "multi-select" || q.type === "tags") && !Array.isArray(value)) {
    return { key: q.key, message: "Expected a list." };
  }
  if (q.type === "text" && typeof value !== "string") {
    return { key: q.key, message: "Expected text." };
  }
  if (q.type === "single-select" && q.options && typeof value === "string") {
    if (!q.options.some((o) => o.value === value)) return { key: q.key, message: "Choose a valid option." };
  }
  if (q.type === "multi-select" && q.options && Array.isArray(value)) {
    const allowed = new Set(q.options.map((o) => o.value));
    if (!value.every((v) => allowed.has(v))) return { key: q.key, message: "Contains an invalid option." };
  }
  return null;
}

/** Validate all required questions. Returns the list of errors (empty = valid). */
export function validateAll(questions: Question[], answers: AnswerMap): FieldError[] {
  const errors: FieldError[] = [];
  for (const q of questions) {
    const err = validateAnswer(q, answers[q.key]);
    if (err) errors.push(err);
  }
  return errors;
}
