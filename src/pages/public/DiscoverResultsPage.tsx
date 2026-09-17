import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { discoveryService, type SessionRef } from "@/services/discoveryService";
import { getStoredAnonToken } from "@/features/discovery/storage";
import type { DiscoveryOutput } from "@/types/schemas/discovery-output";
import type { Opportunity } from "@/types/schemas/opportunity";

export function DiscoverResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const passed = (location.state as { output?: DiscoveryOutput; sessionId?: string } | null) ?? null;
  const [output, setOutput] = useState<DiscoveryOutput | null>(passed?.output ?? null);
  const [loading, setLoading] = useState(!passed?.output && Boolean(passed?.sessionId));
  const [choosing, setChoosing] = useState<string | null>(null);
  const [chooseError, setChooseError] = useState<string | null>(null);

  const sessionId = passed?.sessionId ?? null;

  useEffect(() => {
    if (output || !sessionId) return;
    let active = true; setLoading(true);
    discoveryService.getResults(sessionId)
      .then((r) => active && setOutput(r))
      .catch(() => { /* empty state */ })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [output, sessionId]);

  const choose = async (o: Opportunity) => {
    setChooseError(null);
    if (!sessionId || !o.id) { setChooseError("This opportunity can't be selected (missing session or id)."); return; }
    const ref: SessionRef = { id: sessionId, anonToken: getStoredAnonToken() };
    setChoosing(o.id);
    try {
      await discoveryService.selectOpportunity(ref, o.id);
      const { blueprint } = await discoveryService.generateBlueprint(ref);
      navigate("/blueprint", { state: { blueprint, sessionId } });
    } catch (e) {
      setChooseError(e instanceof Error ? e.message : "Couldn't generate the blueprint.");
    } finally { setChoosing(null); }
  };

  return (
    <Container>
      <Seo title="Discovery Results" description="Your recommended digital product opportunities and blueprint." />
      <div style={{ maxWidth: 820, margin: "var(--space-12) auto var(--space-24)" }}>
        <span className="eyebrow">Discovery Results</span>
        <h1>Here's what fits you</h1>

        {loading && <LoadingState label="Loading your results…" />}

        {!loading && !output && (
          <EmptyState
            title="No results to show yet"
            message="Complete a Discovery run and your opportunities and blueprint will appear here. Nothing is shown that wasn't generated from your answers."
            action={<ButtonLink to="/discover" size="sm">Start Discovery</ButtonLink>}
          />
        )}

        {!loading && output && (
          <>
            <ProfileSummary output={output} />
            {chooseError && <p className="d-field-error" style={{ marginTop: 12 }}>{chooseError}</p>}

            <h2 style={{ marginTop: "var(--space-8)" }}>Recommended opportunities</h2>
            <p className="muted" style={{ marginTop: -6 }}>Pick one to turn into a blueprint.</p>
            {(output.productOpportunities ?? []).length === 0
              ? <p className="muted">No opportunities were returned.</p>
              : (output.productOpportunities ?? []).map((o, i) =>
                  <OppCard key={i} o={o} onChoose={choose} busy={choosing === o.id} disabled={Boolean(choosing)} />)}

            {(output.unexpectedOpportunities ?? []).length > 0 && (
              <>
                <h2 style={{ marginTop: "var(--space-8)" }}>Unexpected / spinoff ideas</h2>
                {(output.unexpectedOpportunities ?? []).map((o, i) =>
                  <OppCard key={i} o={o} unexpected onChoose={choose} busy={choosing === o.id} disabled={Boolean(choosing)} />)}
              </>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

function ProfileSummary({ output }: { output: DiscoveryOutput }) {
  const p = output.userProfile ?? {};
  const chips = [...(p.skills ?? []), ...(p.interests ?? [])].slice(0, 8);
  if (chips.length === 0) return null;
  return (
    <Card style={{ marginTop: "var(--space-6)" }}>
      <span className="eyebrow">What we learned</span>
      <p className="muted" style={{ marginTop: 6, marginBottom: 10 }}>Based on what you told us:</p>
      <div className="row wrap">{chips.map((c, i) => <span key={i} className="tag">{c}</span>)}</div>
    </Card>
  );
}

function OppCard({ o, unexpected, onChoose, busy, disabled }:
  { o: Opportunity; unexpected?: boolean; onChoose: (o: Opportunity) => void; busy: boolean; disabled: boolean }) {
  return (
    <Card className={`opp-card ${unexpected ? "unexpected" : ""}`} style={{ marginTop: "var(--space-4)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>{o.name}</h3>
        {unexpected ? <Badge tone="soon">Unexpected</Badge> : <Badge tone="accent">{o.productFormat}</Badge>}
      </div>
      {o.description && <p className="muted" style={{ marginTop: 8 }}>{o.description}</p>}
      <div className="opp-meta">
        <div><small>Buyer</small><p style={{ margin: "4px 0 0" }}>{o.targetBuyer}</p></div>
        <div><small>Problem</small><p style={{ margin: "4px 0 0" }}>{o.problem}</p></div>
        <div><small>Outcome</small><p style={{ margin: "4px 0 0" }}>{o.outcome}</p></div>
      </div>
      {o.reasoning && <p className="muted" style={{ marginTop: 10, fontSize: "0.9rem" }}><strong>Why it fits:</strong> {o.reasoning}</p>}
      {o.evidence && o.evidence.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {o.evidence.map((e, i) => (
            <p key={i} className="ev" style={{ margin: "4px 0" }}><span className="ev-type">{e.type}</span>{e.statement}</p>
          ))}
        </div>
      )}
      <div style={{ marginTop: "var(--space-4)" }}>
        <Button size="sm" onClick={() => onChoose(o)} disabled={disabled || !o.id}>
          {busy ? "Generating blueprint…" : "Choose this →"}
        </Button>
        {!o.id && <p className="dim" style={{ fontSize: "0.75rem", marginTop: 6 }}>Selection unavailable for this item.</p>}
      </div>
    </Card>
  );
}
