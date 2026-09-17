import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

/**
 * Real auth gate. Checks the Supabase session and redirects unauthenticated
 * users to /login. No fake authorization. If Supabase isn't configured yet
 * (local dev without env), it shows an honest "not configured" placeholder
 * rather than pretending the user is signed in.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    authService
      .getSession()
      .then((s: Session | null) => active && setState(s ? "in" : "out"))
      .catch(() => active && setState("out"));
    const { data } = authService.onAuthStateChange((s) => active && setState(s ? "in" : "out"));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <PlaceholderPage
        title="Account area"
        what="The authenticated application shell (dashboard, products, settings)."
        why="These screens require a signed-in account backed by Supabase."
        next="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then sign in to continue."
      />
    );
  }
  if (state === "loading") return <LoadingState label="Checking your session…" />;
  if (state === "out") return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
