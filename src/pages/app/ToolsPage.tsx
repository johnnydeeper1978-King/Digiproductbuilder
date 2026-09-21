import { useEffect, useState } from "react";
import { Seo } from "@/components/seo/Seo";
import { LoadingState } from "@/components/feedback/LoadingState";
import { toolsService, type Tool } from "@/services/toolsService";

const CAT_LABEL: Record<string, string> = {
  "product-creation": "Product creation", "landing-page": "Landing pages",
  payments: "Payments & checkout", email: "Email marketing", content: "Content",
};

export function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    toolsService.all().then((t) => active && setTools(t)).catch(() => {}).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const byCat = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t); return acc;
  }, {});

  return (
    <>
      <Seo title="Tools" />
      <div className="app-head">
        <div><span className="eyebrow">TOOLS</span><h1>Recommended tools</h1>
          <p>Vetted tools to create, launch and sell your product. Affiliate links appear only where a real partnership exists.</p></div>
      </div>

      {loading ? <LoadingState label="Loading tools…" /> : tools.length === 0 ? (
        <div className="app-empty">
          <h3>Tool recommendations are on the way</h3>
          <p>Your Builder suggests the right tool categories at each stage. The full recommended-tools catalogue appears here once it's published.</p>
        </div>
      ) : (
        Object.entries(byCat).map(([cat, list]) => (
          <div key={cat} style={{ marginBottom: 26 }}>
            <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 12px" }}>{CAT_LABEL[cat] ?? cat}</h3>
            <div className="app-grid grid-3">
              {list.map((t) => (
                <div key={t.id} className="tool-card">
                  <div className="tcat">{CAT_LABEL[t.category] ?? t.category}</div>
                  <h4>{t.name}{t.is_affiliate && <span className="soon" style={{ marginLeft: 8 }}>PARTNER</span>}</h4>
                  {t.purpose && <p>{t.purpose}</p>}
                  {t.alternative && <div className="talt">Alternative: {t.alternative}</div>}
                  {t.affiliate_url && (
                    <div style={{ marginTop: 12 }}>
                      <a className="btn btn-secondary btn-sm" href={t.affiliate_url} target="_blank" rel="noopener noreferrer">Visit →</a>
                      {t.disclosure && <div className="talt">{t.disclosure}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
