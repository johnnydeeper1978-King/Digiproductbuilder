import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { isSupabaseConfigured } from "@/config/env";
import { requireSupabase } from "@/lib/supabase/client";
import { authService } from "@/services/authService";
import { discoveryService } from "@/services/discoveryService";
import { getStoredAnonToken } from "@/features/discovery/storage";

type Mode = "signin" | "signup" | "reset" | "newpass";

/** Only same-site relative paths are allowed as a post-login destination. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/library";
  return raw;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = requireSupabase().auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setMode("newpass"); setNotice("Choose a new password."); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const afterSignIn = async () => {
    const token = getStoredAnonToken();
    if (token) await discoveryService.claim(token).catch(() => { /* nothing to claim */ });
    navigate(next, { replace: true });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      const sb = requireSupabase();
      if (mode === "signin") {
        await authService.signInWithPassword(email.trim(), password);
        await afterSignIn();
      } else if (mode === "signup") {
        const { data, error: err } = await sb.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(next)}` },
        });
        if (err) throw err;
        if (data.session) await afterSignIn();
        else setNotice("Check your inbox to confirm your email, then come back and sign in. (Check spam if it doesn't arrive in a minute.)");
      } else if (mode === "reset") {
        const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` });
        if (err) throw err;
        setNotice("If an account exists for that email, a reset link is on its way.");
      } else {
        const { error: err } = await sb.auth.updateUser({ password });
        if (err) throw err;
        await afterSignIn();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(/invalid login/i.test(msg) ? "That email and password don't match. Try again or reset your password."
        : /not confirmed/i.test(msg) ? "Please confirm your email first — check your inbox for the link." : msg);
    } finally { setBusy(false); }
  }

  const title = mode === "signup" ? "Create your free account" : mode === "reset" ? "Reset your password" : mode === "newpass" ? "Set a new password" : "Sign in";

  return (
    <section className="mk-section mk-pad">
      <Seo title={title} description="Sign in to your 369 Degrees account." />
      <div className="container">
        <div className="mk-auth">
          <div className="eyebrow">369 DEGREES ACCOUNT</div>
          <h1>{title}</h1>
          <p className="mk-muted">
            {mode === "signup" ? "Your account holds your Discovery results, purchased systems, saved worksheets and progress."
              : next.startsWith("/marketplace") ? "Sign in to continue to checkout. New here? Create a free account in seconds."
              : "Welcome back. Your library and progress are waiting."}
          </p>
          {!isSupabaseConfigured && <p className="mk-err">Sign-in is temporarily unavailable.</p>}
          <form onSubmit={onSubmit} className="mk-form">
            {mode !== "newpass" && (
              <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} /></label>
            )}
            {mode !== "reset" && (
              <label>{mode === "newpass" ? "New password" : "Password"}
                <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
              </label>
            )}
            {error && <p className="mk-err">{error}</p>}
            {notice && <p className="mk-ok">{notice}</p>}
            <button className="btn primary mk-wide" type="submit" disabled={busy || !isSupabaseConfigured}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : mode === "newpass" ? "Save password" : "Sign in"}
            </button>
          </form>
          <div className="mk-auth-links">
            {mode === "signin" && <><button type="button" onClick={() => setMode("signup")}>Create a free account</button><button type="button" onClick={() => setMode("reset")}>Forgot password?</button></>}
            {mode === "signup" && <button type="button" onClick={() => setMode("signin")}>Already have an account? Sign in</button>}
            {(mode === "reset" || mode === "newpass") && <button type="button" onClick={() => setMode("signin")}>Back to sign in</button>}
          </div>
          {mode === "signup" && <p className="mk-small">By creating an account you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>}
        </div>
      </div>
    </section>
  );
}
