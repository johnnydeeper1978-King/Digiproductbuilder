import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { entitlementsService } from "@/services/entitlementsService";

export function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [hasBuilder, setHasBuilder] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured) return;
      try {
        const s = await authService.getSession();
        if (active) setEmail(s?.user?.email ?? null);
        const ent = await entitlementsService.hasBuilderAccess();
        if (active) setHasBuilder(ent);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const signOut = async () => {
    setBusy(true);
    try { await authService.signOut(); navigate("/"); }
    catch { setBusy(false); }
  };

  return (
    <>
      <Seo title="Settings" />
      <div className="app-head"><div><span className="eyebrow">ACCOUNT</span><h1>Settings</h1><p>Manage your account and access.</p></div></div>
      <div className="panel" style={{ maxWidth: 640 }}>
        <h3>Account</h3>
        <div className="set-row"><span className="k">Email</span><span className="v">{email ?? "—"}</span></div>
        <div className="set-row"><span className="k">Builder access</span>
          <span className="v">{hasBuilder === null ? "—" : hasBuilder ? "Active" : "Locked ($47 one-time)"}</span></div>
        <div className="set-row"><span className="k">Plan</span><span className="v">369 Degrees</span></div>
      </div>
      <div className="panel" style={{ maxWidth: 640 }}>
        <h3>Session</h3>
        <p className="psub">Sign out of your account on this device.</p>
        <Button variant="secondary" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</Button>
      </div>
    </>
  );
}
