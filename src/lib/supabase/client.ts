/**
 * Supabase browser client boundary.
 *
 * - Uses ONLY the public URL + anon key (safe for the browser).
 * - The service-role key is NEVER imported here; privileged operations run
 *   in Supabase Edge Functions (see supabase/functions/).
 * - If env is not configured, the client is `null` and callers must handle
 *   that explicitly. We never fake a session or fabricate data.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/config/env";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl as string, env.supabaseAnonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    this.name = "SupabaseNotConfiguredError";
  }
}

/** Returns the client or throws a clear error — never returns a fake. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new SupabaseNotConfiguredError();
  return supabase;
}
