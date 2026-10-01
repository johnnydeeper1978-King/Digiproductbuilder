// Shapes returned by the `product-access` edge function.

export interface CatalogProduct {
  key: string;
  kind: "system" | "service";
  title: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  status: "coming_soon" | "live" | "retired" | "draft";
  price_cents: number | null;
  list_price_cents: number | null;
  currency: string;
  who_for: string[];
  outcomes: string[];
  includes: string[];
  purchasable: boolean;
  modules?: number;
  owned?: boolean;
}

export interface LessonOutline {
  id: string; position: number; title: string; summary: string | null;
  est_minutes: number | null; is_preview: boolean;
}
export interface ModuleOutline {
  id: string; position: number; title: string; summary: string | null; outcome: string | null;
  lessons: LessonOutline[];
}

export interface ProgressSummary {
  lessons: number; completed: number; percent: number;
  modules: number; modulesCompleted: number;
  nextLessonId: string | null;
  currentModule: { position: number; title: string } | null;
  byLesson?: Record<string, "started" | "completed">;
}

export interface ProductDetail {
  product: CatalogProduct;
  owned: boolean;
  modules: ModuleOutline[];
  resourceCounts: Record<string, number>;
  resourceTitles: string[];
  progress: ProgressSummary | null;
}

// ---- Lesson content (369 content format) ----
export interface QuizQuestion { q: string; options: string[]; answer: number; explain: string; }
export type Section =
  | { kind: "overview"; what: string; why: string; do: string; output: string }
  | { kind: "learn" | "see_it" | "try_it" | "use_it" | "complete"; title?: string; markdown: string; resource?: string }
  | { kind: "quiz"; questions: QuizQuestion[] };

// ---- Interactive resources ----
export type FieldInput = "text" | "textarea" | "number" | "currency" | "date" | "select" | "rating" | "list";
export interface FormField { id: string; label: string; input: FieldInput; options?: string[]; help?: string; placeholder?: string; }
export type ColumnInput = "text" | "number" | "currency" | "date" | "select" | "checkbox" | "percent";
export interface TableColumn { id: string; label: string; input: ColumnInput; options?: string[]; formula?: string; }

export type ResourceContent =
  | { type: "form"; intro?: string; fields: FormField[] }
  | { type: "builder"; intro?: string; pulls: string[]; fields: FormField[] }
  | { type: "checklist"; intro?: string; items: string[] }
  | {
      type: "table"; intro?: string; columns: TableColumn[];
      starter_rows?: Record<string, unknown>[]; totals?: string[]; group_by?: string; formula_notes?: string;
    };

export interface ResourceDef {
  key: string; title: string; kind: string; content: ResourceContent;
  module?: { position: number; title: string } | null;
  locked?: boolean;
}

export interface Entry { data: Record<string, unknown>; savedAt: string; }

export interface LessonData {
  product: { key: string; title: string };
  module: { id: string; position: number; title: string; outcome: string | null };
  lesson: LessonOutline & { module_id: string };
  body: { sections: Section[] };
  resources: ResourceDef[];
  owned: boolean;
  preview: boolean;
  watermark: { email: string | null; userRef: string; issuedAt: string } | null;
  status: "started" | "completed" | null;
  lessonIndex: number; lessonCount: number;
  prevLessonId: string | null; nextLessonId: string | null;
}

export interface VaultItem {
  key: string; title: string; kind: string; type: ResourceContent["type"];
  module: { position: number; title: string } | null;
  savedAt: string | null;
}

export interface DashboardData {
  product: CatalogProduct;
  modules: ModuleOutline[];
  progress: ProgressSummary;
  vault: VaultItem[];
  os: { key: string | null; title?: string; built: boolean };
  completed: boolean;
}

export interface ResourceData { productKey: string; resource: ResourceDef; entry: Entry | null; }

export interface OsData {
  builder: ResourceDef & { entry: Entry | null };
  pulled: (ResourceDef & { entry: Entry | null })[];
  progress: ProgressSummary;
}

export interface LibraryData {
  products: (CatalogProduct & { progress: ProgressSummary; os: { built: boolean }; completed: boolean })[];
  locked: CatalogProduct[];
}
