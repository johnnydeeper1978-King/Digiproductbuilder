import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { catalogService, AccessError } from "@/services/catalogService";
import { MkState } from "@/features/catalog/components";
import { loginPath, useSession } from "@/features/catalog/useSession";
import { ResourceTool } from "@/features/catalog/ResourceTool";
import type { ResourceData } from "@/features/catalog/types";

export function ResourcePage() {
  const { key = "", resourceKey = "" } = useParams();
  const session = useSession();
  const [data, setData] = useState<ResourceData | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    catalogService.resource(resourceKey).then((d) => active && setData(d))
      .catch((e) => {
        if (!active) return;
        if (e instanceof AccessError && e.code === "not_entitled") setDenied(true);
        else setError((e as Error).message);
      });
    return () => { active = false; };
  }, [session, resourceKey]);

  if (session === null) return <Navigate to={loginPath(`/library/${key}/tools/${resourceKey}`)} replace />;
  if (denied) return <Navigate to={`/marketplace/${key}`} replace />;
  if (error) return <div className="container mk-pad"><MkState title="This tool didn't load" message={error} action={<Link className="btn outline" to={`/library/${key}`}>Back to dashboard</Link>} /></div>;
  if (!data) return <div className="container mk-pad"><MkState loading title="Loading…" /></div>;

  const r = data.resource;
  return (
    <section className="mk-section mk-pad">
      <Seo title={r.title} />
      <div className="container mk-tool">
        <Link className="mk-back" to={`/library/${data.productKey}`}>← Back to dashboard</Link>
        <div className="mk-small">{r.module ? `Module ${r.module.position} · ${r.module.title}` : "Resource vault"}</div>
        <h1>{r.title}</h1>
        <ResourceTool def={r} initial={data.entry?.data ?? null} savedAt={data.entry?.savedAt}
          onSave={async (d) => (await catalogService.saveEntry(r.key, d)).savedAt} />
      </div>
    </section>
  );
}
