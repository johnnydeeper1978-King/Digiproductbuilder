/**
 * Authentication boundary — thin wrapper over Supabase Auth.
 * Real auth only; no mocked sessions. Requires configured Supabase env.
 */
import { requireSupabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export const authService = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await requireSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signInWithPassword(email: string, password: string): Promise<Session> {
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async signUp(email: string, password: string): Promise<User | null> {
    const { data, error } = await requireSupabase().auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  },

  async signOut(): Promise<void> {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(cb: (session: Session | null) => void) {
    return requireSupabase().auth.onAuthStateChange((_event, session) => cb(session));
  },
};
