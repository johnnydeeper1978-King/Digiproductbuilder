import { useEffect, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { ButtonLink } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/config/env";
import { authService } from "@/services/authService";
import { requireSupabase } from "@/lib/supabase/client";
import { entitlementsService } from "@/services/entitlementsService";

const JOURNEY = ["Discover", "Blueprint", "Build", "Launch", "Sell", "Scale", "Automate", "AI Workforce"];

interface DashData {
  name: string;
  products: number;
  active: number;
  hasBuilder: boolean;
  step: number; // 1-based position in JOURNEY
  events: { type: string; created_at: string }[];
}

const EVENT_LABEL: Record<string, string> = {
  discovery_started: "Started Discovery",
  discovery_completed: "Discovery completed",
  opportunities_generated: "Opportunities generated",
  blueprint_generated: "Blueprint generated",
  purchase_completed: "Builder unlocked",
  builder_started: "Builder started",
  builder_completed: "Product completed",
};

function ago(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function DashboardPage() {
  const [d, setD] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const empty: DashData = { name: "Creator", products: 0, active: 0, hasBuilder: false, step: 1, events: [] };
      if (!isSupabaseConfigured) { if (active) { setD(empty); setLoading(false); } return; }
      try {
        const session = await authService.getSession();
        const uid = session?.user?.id;
        const name = session?.user?.email?.split("@")[0] ?? "Creator";
        if (!uid) { if (active) { setD({ ...empty, name }); setLoading(false); } return; }
        const sb = requireSupabase();
        const [{ data: products }, hasBuilder, { data: events }] = await Promise.all([
          sb.from("products").select("id,status").eq("user_id", uid),
          entitlementsService.hasBuilderAccess(),
          sb.from("events").select("type,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(6),
        ]);
        const list = products ?? [];
        const activeCount = list.filter((p) => p.status !== "archived").length;
        const step = hasBuilder ? 3 : list.length > 0 ? 2 : 1;
        if (active) setD({ name, products: list.length, active: activeCount, hasBuilder, step, events: events ?? [] });
      } catch {
        if (active) setD(empty);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const data = d ?? { name: "Creator", products: 0, active: 0, hasBuilder: false, step: 1, events: [] };

  return (
    <>
      <Seo title="Dashboard" />
      <div className="dash-welcome">
        <h1>Welcome back, {data.name}!</h1>
        <p>{loading ? "Loading your journey…" : "Here's your digital product journey so far."}</p>
      </div>

      <div className="stat-row">
        <div className="stat"><small>Products created</small><b>{data.products}</b>
          <span className="pill muted">{data.products === 0 ? "None yet" : "In your library"}</span></div>
        <div className="stat"><small>Active projects</small><b>{data.active}</b>
          <span className="pill muted">Up to 3 per account</span></div>
        <div className="stat"><small>Builder access</small><b>{data.hasBuilder ? "Active" : "Locked"}</b>
          <span className={`pill ${data.hasBuilder ? "ok" : "muted"}`}>{data.hasBuilder ? "Unlocked" : "$47 one-time"}</span></div>
      </div>

      <div className="panel">
        <h3>Your progress</h3>
        <p className="psub">From discovering your product to scaling it with an AI workforce.</p>
        <div className="track">
          {JOURNEY.map((label, i) => {
            const n = i + 1;
            const cls = n < data.step ? "done" : n === data.step ? "cur" : "";
            return (
              <div key={label} style={{ display: "flex", alignItems: "flex-start" }}>
                <div className={`t ${cls}`}><div className="dot">{n < data.step ? "✓" : n}</div><span>{label}</span></div>
                {i < JOURNEY.length - 1 && <div className={`line ${n < data.step ? "done" : ""}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-2">
        <div className="panel">
          <h3>Recent activity</h3>
          <p className="psub">Your latest steps across 369 Degrees.</p>
          {data.events.length === 0 ? (
            <div className="dash-empty">No activity yet — your journey starts with Discovery.</div>
          ) : (
            <div className="activity">
              {data.events.map((e, i) => (
                <div className="act" key={i}>
                  <div className="ai">◆</div>
                  <div><b>{EVENT_LABEL[e.type] ?? e.type}</b></div>
                  <time>{ago(e.created_at)}</time>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel dash-next">
          <span className="eyebrow">DO THIS NEXT</span>
          {data.hasBuilder ? (
            <>
              <h3>Continue building</h3>
              <p>Pick up your product where you left off and move to the next phase.</p>
              <ButtonLink to="/builder">Open the Builder →</ButtonLink>
            </>
          ) : data.products > 0 ? (
            <>
              <h3>Unlock the Builder</h3>
              <p>You have a blueprint — get the $47 Builder to turn it into a sellable product.</p>
              <ButtonLink to="/builder">Get the Builder — $47 →</ButtonLink>
            </>
          ) : (
            <>
              <h3>Start with Discovery</h3>
              <p>Answer a few guided questions and get your first product opportunity — free.</p>
              <ButtonLink to="/discover">Start Free Discovery →</ButtonLink>
            </>
          )}
        </div>
      </div>
    </>
  );
}
