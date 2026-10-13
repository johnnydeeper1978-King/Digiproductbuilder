/**
 * Client environment access.
 *
 * ONLY VITE_-prefixed variables exist here — these are compiled into the
 * browser bundle and are therefore PUBLIC. Never read service-role keys,
 * AI provider keys, or payment secrets in this file (or anywhere in src/).
 */
export interface ClientEnv {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  appUrl: string;
  /** Whop hosted checkout link for the Builder (public URL, not a secret). */
  whopBuilderUrl: string;
  /** Whop hosted checkout link for the Digital Marketing OS (public URL). */
  whopDmosUrl: string;
}

export const env: ClientEnv = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  appUrl: import.meta.env.VITE_APP_URL ?? "http://localhost:5173",
  whopBuilderUrl:
    import.meta.env.VITE_WHOP_BUILDER_URL ??
    "https://whop.com/369-degrees-77fb/digital-product-builder-ad/",
  whopDmosUrl: import.meta.env.VITE_WHOP_DMOS_URL ?? "",
};

/** True only when the public Supabase config is present. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
