/** Client-side Builder state types (mirror of products.builder_state). */
export type BuilderPhase =
  | "strategy" | "customer" | "offer" | "creation" | "brand"
  | "landing" | "payment" | "content" | "launch" | "optimization";

export type PhaseStatus = "not-started" | "in-progress" | "completed";

export interface BuilderOutput {
  id: string;
  createdAt: string;
  data: { summary: string; sections: { title: string; body: string }[]; nextStep?: string };
}

export interface PhaseState {
  status: PhaseStatus;
  inputs: Record<string, unknown>;
  outputs: BuilderOutput[];
  currentTask?: string | null;
  updatedAt: string | null;
}

export interface BuilderState {
  version: number;
  currentPhase: BuilderPhase;
  status: "in-progress" | "completed";
  completedPhases: string[];
  phases: Partial<Record<BuilderPhase, PhaseState>>;
  updatedAt: string;
}

export interface BuilderContextResponse {
  product: { id: string; name: string; status: string; current_phase: string; progress: number };
  blueprint: unknown | null;
  userProfile: unknown | null;
  builderState: BuilderState;
  hasBlueprint: boolean;
}
