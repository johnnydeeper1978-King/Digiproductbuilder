import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useDiscovery } from "@/features/discovery/useDiscovery";
import { QuestionInput } from "@/features/discovery/QuestionInput";
import { DISCOVERY_STEP_LABELS } from "@/features/discovery/questions";

export function DiscoverPage() {
  const d = useDiscovery();

  return (
    <Container>
      <Seo title="Free Discovery" description="Answer a short guided flow and get digital product opportunities matched to you." />
      <div className="d-wrap">
        {d.phase === "intro" && (
          <div>
            <span className="eyebrow">Free Discovery</span>
            <h1>Let's find a product that actually fits you.</h1>
            <p className="muted">
              A short, guided flow — a few minutes. We'll learn your skills, interests, time and goals,
              then the guide suggests specific product opportunities and a blueprint. It's free, and it
              ends with something you can act on.
            </p>
            {d.persistenceOff && (
              <div className="d-notice">
                Heads up: the backend isn't configured in this environment yet, so your answers won't be
                saved and the AI analysis can't run. You can still walk through the questions.
              </div>
            )}
            {d.resuming ? <LoadingState label="Checking for a session to resume…" /> : (
              <div className="row" style={{ marginTop: "var(--space-6)" }}>
                <Button onClick={d.begin}>Start Discovery</Button>
                <ButtonLink to="/builder" variant="ghost">I already know what to build →</ButtonLink>
              </div>
            )}
          </div>
        )}

        {d.phase === "questions" && d.current && (
          <div>
            <div className="d-progress"><span style={{ width: `${d.progress}%` }} /></div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="d-step-label">{DISCOVERY_STEP_LABELS[d.current.step]}</span>
              <span className="d-step-label">{d.index + 1} / {d.total}</span>
            </div>
            <h2 className="d-q-title">{d.current.title}</h2>
            {d.current.help && <p className="muted" style={{ fontSize: "0.92rem" }}>{d.current.help}</p>}

            <QuestionInput q={d.current} value={d.answers[d.current.key]}
              onChange={(v) => d.setAnswer(d.current!.key, v)} />
            {d.fieldError && <p className="d-field-error">{d.fieldError.message}</p>}

            <div className="d-nav">
              <Button variant="ghost" onClick={d.back} disabled={d.index === 0}>← Back</Button>
              {d.index < d.total - 1
                ? <Button variant="secondary" onClick={d.next}>Next →</Button>
                : <Button onClick={d.submit}>See my opportunities</Button>}
            </div>
            {!d.current.required && (
              <p className="dim" style={{ fontSize: "0.78rem", marginTop: 10 }}>This question is optional.</p>
            )}
          </div>
        )}

        {d.phase === "submitting" && <LoadingState label="Analysing your answers…" />}

        {d.phase === "done" && (
          <div className="state">
            <h3>Your opportunities are ready</h3>
            <p className="muted">We turned your answers into product opportunities and a blueprint.</p>
            <ButtonLink to="/discover/results" state={{ output: d.output, sessionId: d.sessionRef?.id }}>View results →</ButtonLink>
          </div>
        )}

        {d.phase === "error" && (
          <ErrorState
            title="We couldn't complete Discovery"
            message={d.error ?? undefined}
            onRetry={() => window.location.reload()}
          />
        )}

        {d.phase === "questions" && (
          <p className="dim" style={{ fontSize: "0.78rem", marginTop: "var(--space-8)" }}>
            You can leave and come back — <Link to="/discover">your progress resumes here</Link>.
          </p>
        )}
      </div>
    </Container>
  );
}
