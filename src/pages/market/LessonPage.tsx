import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService, AccessError } from "@/services/catalogService";
import { MkState } from "@/features/catalog/components";
import { loginPath, useSession } from "@/features/catalog/useSession";
import { Markdown } from "@/features/catalog/Markdown";
import { ResourceTool } from "@/features/catalog/ResourceTool";
import type { LessonData, QuizQuestion, ResourceData, ResourceDef, Section } from "@/features/catalog/types";

const STEPS: [Section["kind"], string][] = [
  ["learn", "Learn"], ["see_it", "See it"], ["try_it", "Try it"], ["use_it", "Use it"], ["quiz", "Test yourself"], ["complete", "Complete"],
];

export function LessonPage() {
  const { lessonId = "" } = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const [data, setData] = useState<LessonData | null>(null);
  const [denied, setDenied] = useState<{ code: string; productKey?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (session === undefined) return;
    let active = true;
    setData(null); setDenied(null); setError(null);
    catalogService.lesson(lessonId).then((d) => { if (active) { setData(d); window.scrollTo(0, 0); } })
      .catch((e) => {
        if (!active) return;
        if (e instanceof AccessError && (e.code === "unauthorized" || e.code === "not_entitled")) setDenied({ code: e.code, productKey: e.productKey });
        else setError((e as Error).message);
      });
    return () => { active = false; };
  }, [lessonId, session]);

  if (denied?.code === "unauthorized") return <Navigate to={loginPath(`/learn/${lessonId}`)} replace />;
  if (denied?.code === "not_entitled") return <Navigate to={denied.productKey ? `/marketplace/${denied.productKey}` : "/marketplace"} replace />;
  if (error) return <div className="container mk-pad"><MkState title="This lesson didn't load" message={error} action={<button className="btn outline" onClick={() => window.location.reload()}>Try again</button>} /></div>;
  if (!data) return <div className="container mk-pad"><MkState loading title="Loading lesson…" /></div>;

  const { product, module, lesson, body, owned, watermark } = data;
  const overview = body.sections.find((s) => s.kind === "overview") as Extract<Section, { kind: "overview" }> | undefined;
  const resources = new Map(data.resources.map((r) => [r.key, r]));

  const complete = async () => {
    setCompleting(true);
    try {
      await catalogService.progress(lesson.id, "completed");
      navigate(data.nextLessonId ? `/learn/${data.nextLessonId}` : `/library/${product.key}/os`);
    } catch (e) { setError((e as Error).message); }
    finally { setCompleting(false); }
  };

  return (
    <div className="mk-lesson-wrap">
      <Seo title={`${lesson.title} · ${product.title}`} />
      {watermark && <div className="mk-watermark" aria-hidden>{Array.from({ length: 18 }, (_, i) => <span key={i}>{watermark.email ?? watermark.userRef} · {watermark.userRef}</span>)}</div>}
      <div className="container mk-lesson">
        <nav className="mk-crumbs" aria-label="Breadcrumb">
          {owned ? <><Link to="/library">Library</Link><span>›</span><Link to={`/library/${product.key}`}>{product.title}</Link></>
                 : <><Link to="/marketplace">Marketplace</Link><span>›</span><Link to={`/marketplace/${product.key}`}>{product.title}</Link></>}
          <span>›</span><span>Module {module.position}</span>
        </nav>
        {data.preview && <div className="mk-banner">Free preview lesson. <Link to={`/marketplace/${product.key}`}>Get the full system →</Link></div>}

        <header className="mk-lesson-head">
          <div className="mk-small">Module {module.position} · {module.title} · Lesson {lesson.position}{lesson.est_minutes ? ` · ${lesson.est_minutes} min` : ""}</div>
          <h1>{lesson.title}</h1>
          {data.status === "completed" && <span className="mk-chip mk-chip-owned">Completed</span>}
        </header>

        {overview && (
          <div className="mk-overview">
            <div><small>What is this?</small><p>{overview.what}</p></div>
            <div><small>Why does it matter?</small><p>{overview.why}</p></div>
            <div><small>What do I do?</small><p>{overview.do}</p></div>
            <div><small>What will I have?</small><p>{overview.output}</p></div>
          </div>
        )}

        <div className="mk-stepnav" aria-label="Lesson steps">
          {STEPS.filter(([k]) => body.sections.some((s) => s.kind === k)).map(([k, label], i) => <a key={k} href={`#s-${k}`}><span>{i + 1}</span>{label}</a>)}
        </div>

        <article className={`mk-article ${owned ? "mk-protected" : ""}`}>
          {body.sections.filter((s) => s.kind !== "overview").map((s, i) => {
            const label = STEPS.find(([k]) => k === s.kind)?.[1] ?? "";
            if (s.kind === "quiz") return (
              <section key={i} id={`s-${s.kind}`} className="mk-sec mk-sec-quiz">
                <h2><span className="mk-sec-tag">Test yourself</span></h2>
                {s.questions.map((q, j) => <Quiz key={`${lesson.id}-${j}`} q={q} n={j + 1} />)}
              </section>
            );
            const res = "resource" in s && s.resource ? resources.get(s.resource) : undefined;
            return (
              <section key={i} id={`s-${s.kind}`} className={`mk-sec mk-sec-${s.kind}`}>
                <h2><span className="mk-sec-tag">{label}</span></h2>
                <Markdown text={s.markdown} />
                {res && <InlineResource def={res} productKey={product.key} owned={owned} />}
                {s.kind === "complete" && owned && (
                  <div className="mk-complete-bar">
                    <button className="btn primary" onClick={complete} disabled={completing}>
                      {completing ? "Saving…" : data.nextLessonId ? "Mark complete & continue →" : "Mark complete & open your system →"}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </article>

        {data.preview && (
          <div className="mk-bottom-cta">
            <div><h3>Liked this lesson?</h3><p className="mk-muted">The full system has {data.lessonCount} lessons, every interactive tool, saved progress and your finished system at the end.</p></div>
            <Link className="btn primary" to={`/marketplace/${product.key}`}>See the full system →</Link>
          </div>
        )}

        <div className="mk-lesson-nav">
          {data.prevLessonId ? <Link className="btn outline" to={`/learn/${data.prevLessonId}`}>← Previous</Link> : <span />}
          <span className="mk-small">Lesson {data.lessonIndex + 1} of {data.lessonCount}</span>
          {owned && data.nextLessonId ? <Link className="btn outline" to={`/learn/${data.nextLessonId}`}>Next →</Link> : <span />}
        </div>
      </div>
    </div>
  );
}

function Quiz({ q, n }: { q: QuizQuestion; n: number }) {
  const [pick, setPick] = useState<number | null>(null);
  const answered = pick !== null;
  return (
    <div className="mk-quiz">
      <p className="mk-q"><b>{n}.</b> {q.q}</p>
      <div className="mk-opts">
        {q.options.map((o, i) => (
          <button key={i} type="button" disabled={answered}
            className={answered ? (i === q.answer ? "right" : i === pick ? "wrong" : "") : ""}
            onClick={() => setPick(i)}>{o}</button>
        ))}
      </div>
      {answered && <p className={`mk-explain ${pick === q.answer ? "ok" : ""}`}><b>{pick === q.answer ? "Correct. " : "Not quite. "}</b>{q.explain}</p>}
    </div>
  );
}

function InlineResource({ def, productKey, owned }: { def: ResourceDef; productKey: string; owned: boolean }) {
  const [data, setData] = useState<ResourceData | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!owned || !open || data) return;
    catalogService.resource(def.key).then(setData).catch((e) => setError((e as Error).message));
  }, [owned, open, data, def.key]);

  if (!owned || def.locked) {
    return (
      <div className="mk-res mk-res-locked">
        <div><span className="mk-res-kind">{def.kind}</span><b>🔒 {def.title}</b></div>
        <p className="mk-small">Included in the full system — fill it in right here and save your answers.</p>
      </div>
    );
  }
  return (
    <div className="mk-res">
      <div className="mk-res-head">
        <div><span className="mk-res-kind">{def.kind}</span><b>{def.title}</b></div>
        <div className="mk-row">
          <Link className="mk-link" to={`/library/${productKey}/tools/${def.key}`}>Full screen</Link>
          <button className="btn outline" type="button" onClick={() => setOpen((o) => !o)}>{open ? "Hide" : "Open & fill in"}</button>
        </div>
      </div>
      {open && !data && !error && <p className="mk-small">Loading…</p>}
      {error && <p className="mk-err">{error}</p>}
      {open && data && (
        <ResourceTool def={data.resource} initial={data.entry?.data ?? null} savedAt={data.entry?.savedAt}
          onSave={async (d) => (await catalogService.saveEntry(def.key, d)).savedAt} />
      )}
    </div>
  );
}
