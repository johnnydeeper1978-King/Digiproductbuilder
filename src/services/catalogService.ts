/**
 * Marketplace + product-system client. Every call goes through the
 * `product-access` edge function, which checks the caller's paid entitlement
 * server-side before returning any paid lesson, resource or saved entry.
 * Nothing here can grant access: purchases are only marked paid by the
 * verified Whop webhook.
 */
import { env, isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { requireSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/client";
import type {
  CatalogProduct, DashboardData, LessonData, LibraryData, OsData, ProductDetail, ResourceData,
} from "@/features/catalog/types";

export class AccessError extends Error {
  code: string; status: number; productKey?: string;
  constructor(message: string, code: string, status: number, productKey?: string) {
    super(message); this.name = "AccessError"; this.code = code; this.status = status; this.productKey = productKey;
  }
}

async function call<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new SupabaseNotConfiguredError();
  const session = await authService.getSession().catch(() => null);
  const res = await fetch(`${env.supabaseUrl}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.supabaseAnonKey as string,
      Authorization: `Bearer ${session?.access_token ?? env.supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    const code = String(data.error ?? "request_failed");
    throw new AccessError(friendly(code, String(data.message ?? "")), code, res.status,
      typeof data.productKey === "string" ? data.productKey : undefined);
  }
  return data as T;
}

function friendly(code: string, fallback: string): string {
  switch (code) {
    case "unauthorized": return "Please sign in to continue.";
    case "not_entitled": return "This content is part of a product you haven't purchased yet.";
    case "not_found": return "We couldn't find that.";
    case "not_on_sale": return "This product isn't available to buy yet.";
    case "payments_not_configured": return "Checkout for this product opens soon.";
    case "checkout_unavailable": return "Checkout is temporarily unavailable. Please try again in a moment.";
    case "too_large": return "That's too much to save at once. Try splitting it up.";
    default: return fallback || "Something went wrong. Please try again.";
  }
}

const pa = <T,>(action: string, extra: Record<string, unknown> = {}) => call<T>("product-access", { action, ...extra });

export const catalogService = {
  catalog: () => pa<{ products: CatalogProduct[] }>("catalog").then((r) => r.products),
  product: (productKey: string) => pa<ProductDetail>("product", { productKey }),
  lesson: (lessonId: string) => pa<LessonData>("lesson", { lessonId }),
  progress: (lessonId: string, status: "started" | "completed") =>
    pa<{ ok: true; percent: number; completed: number; lessons: number }>("progress", { lessonId, status }),
  dashboard: (productKey: string) => pa<DashboardData>("dashboard", { productKey }),
  resource: (key: string) => pa<ResourceData>("resource", { key }),
  saveEntry: (key: string, data: Record<string, unknown>) => pa<{ ok: true; savedAt: string }>("saveEntry", { key, data }),
  os: (productKey: string) => pa<OsData>("os", { productKey }),
  library: () => pa<LibraryData>("library"),

  /** Starts a Whop checkout for a live product. Requires sign-in. */
  async checkout(productKey: string): Promise<{ url?: string; alreadyOwned?: boolean }> {
    return call("whop-checkout", { productKey, appUrl: window.location.origin });
  },

  /** Joins the waitlist for a product that isn't on sale yet. Insert-only table. */
  async joinWaitlist(productKey: string, email: string, name?: string): Promise<void> {
    const { error } = await requireSupabase().from("waitlist")
      .insert({ product_key: productKey, email: email.trim().toLowerCase(), name: name?.trim() || null, source: "marketplace" });
    // Already on the list is fine.
    if (error && error.code !== "23505") throw new Error("Couldn't add you to the list. Please check your email and try again.");
  },
};

export function formatPrice(cents: number | null | undefined, currency = "USD"): string | null {
  if (cents === null || cents === undefined) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: cents % 100 ? 2 : 0 })
    .format(cents / 100);
}
