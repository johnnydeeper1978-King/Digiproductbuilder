import { Seo } from "@/components/seo/Seo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { isSupabaseConfigured } from "@/config/env";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {
  const navigate = useNavigate();
  return (
    <>
      <Seo title="Settings" />
      <div className="page-head">
        <span className="eyebrow">Account</span>
        <h1>Settings</h1>
      </div>
      <Card>
        <h3>Session</h3>
        <p className="muted">Account, profile and preference settings live here.</p>
        <Button
          variant="secondary" size="sm" disabled={!isSupabaseConfigured}
          onClick={async () => { await authService.signOut(); navigate("/"); }}
        >
          Sign out
        </Button>
      </Card>
    </>
  );
}
