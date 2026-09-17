import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";

/**
 * Real Supabase Auth. No mocked login. When env isn't configured we disable
 * the form and say so plainly rather than faking a session.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authService.signInWithPassword(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container>
      <Seo title="Sign in" description="Sign in to your 369 Degrees account." />
      <div style={{ maxWidth: 420, margin: "var(--space-16) auto" }}>
        <Card>
          <span className="eyebrow">Welcome back</span>
          <h2 style={{ marginTop: 8 }}>Sign in</h2>
          {!isSupabaseConfigured && (
            <p className="dim" style={{ fontSize: "0.88rem" }}>
              Authentication is not configured yet. Add the Supabase environment variables to enable sign in.
            </p>
          )}
          <form onSubmit={onSubmit} className="stack" style={{ marginTop: "var(--space-4)" }}>
            <input
              type="email" placeholder="Email" value={email} required
              onChange={(e) => setEmail(e.target.value)} disabled={!isSupabaseConfigured || busy}
              style={inputStyle}
            />
            <input
              type="password" placeholder="Password" value={password} required
              onChange={(e) => setPassword(e.target.value)} disabled={!isSupabaseConfigured || busy}
              style={inputStyle}
            />
            {error && <p style={{ color: "var(--danger)", fontSize: "0.88rem", margin: 0 }}>{error}</p>}
            <Button type="submit" disabled={!isSupabaseConfigured || busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.7rem 0.9rem", borderRadius: "var(--radius-sm)",
  background: "var(--navy-900)", border: "1px solid var(--border-strong)",
  color: "var(--text)", fontSize: "0.95rem",
};
