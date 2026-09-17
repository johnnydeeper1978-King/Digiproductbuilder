/** Discovery UI question model. */
export type QuestionType = "single-select" | "multi-select" | "text" | "tags";

export interface QuestionOption { value: string; label: string; }

export interface Question {
  /** Stable key stored in discovery_answers.question_key. */
  key: string;
  step: number;
  title: string;
  help?: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
}

/** answer value shapes by question type. */
export type AnswerValue = string | string[];

export type AnswerMap = Record<string, AnswerValue | undefined>;
