import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";

/** undefined = still checking, null = signed out. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(isSupabaseConfigured ? undefined : null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    authService.getSession().then((s) => active && setSession(s)).catch(() => active && setSession(null));
    const { data } = authService.onAuthStateChange((s) => active && setSession(s));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return session;
}

export const loginPath = (next: string) => `/login?next=${encodeURIComponent(next)}`;
