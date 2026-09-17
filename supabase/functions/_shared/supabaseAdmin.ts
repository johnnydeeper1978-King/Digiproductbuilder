// Service-role Supabase client — SERVER ONLY (Deno). Reads secrets from
// Deno.env; never bundled into the browser. Bypasses RLS, so every function
// that uses it MUST enforce ownership itself (JWT uid match or anon_token).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Resolve the caller's auth uid from the Authorization bearer token, if any. */
export async function getCallerUid(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}
