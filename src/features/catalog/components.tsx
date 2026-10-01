import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { catalogService, formatPrice } from "@/services/catalogService";
import type { CatalogProduct } from "./types";

export function MkState({ title, message, action, loading }: { title?: string; message?: string; action?: ReactNode; loading?: boolean }) {
  return (
    <div className="mk-state" role={loading ? "status" : undefined}>
      {loading && <span className="mk-spinner" aria-hidden />}
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div className="mk-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
      <i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

const COVER: Record<string, string> = {
  "digital-marketing-os": "cv-blue", "launch-system": "cv-violet", "content-toolkit": "cv-ink",
  "adhd-system": "cv-mint", "budgeting-system": "cv-gold",
};

export function statusLabel(p: CatalogProduct): { text: string; tone: "live" | "soon" | "owned" | "opening" } {
  if (p.owned) return { text: "In your library", tone: "owned" };
  if (p.status === "live" && p.purchasable) return { text: "Available now", tone: "live" };
  if (p.status === "live") return { text: "Opening soon", tone: "opening" };
  return { text: "Coming soon", tone: "soon" };
}

export function ProductCard({ p }: { p: CatalogProduct }) {
  const s = statusLabel(p);
  const price = formatPrice(p.price_cents, p.currency);
  const list = p.list_price_cents && p.price_cents && p.list_price_cents > p.price_cents ? formatPrice(p.list_price_cents, p.currency) : null;
  return (
    <Link to={`/marketplace/${p.key}`} className="mk-card">
      <div className={`mk-cover ${COVER[p.key] ?? "cv-ink"}`}>
        <span className="mk-cover-cat">{p.category ?? "System"}</span>
        <strong>{p.title.replace(/^369 /, "")}</strong>
        {p.modules ? <span className="mk-cover-meta">{p.modules} modules</span> : null}
      </div>
      <div className="mk-card-body">
        <span className={`mk-chip mk-chip-${s.tone}`}>{s.text}</span>
        <h3>{p.title}</h3>
        {p.tagline && <p>{p.tagline}</p>}
        <div className="mk-card-foot">
          <span className="mk-price">{price ?? "Price TBA"}{list && <s>{list}</s>}</span>
          <span className="mk-link">{p.owned ? "Open →" : s.tone === "live" ? "View system →" : "Learn more →"}</span>
        </div>
      </div>
    </Link>
  );
}

export function WaitlistForm({ productKey, cta = "Notify me", compact }: { productKey: string; cta?: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("busy"); setError(null);
    try { await catalogService.joinWaitlist(productKey, email, name); setState("done"); }
    catch (err) { setState("error"); setError(err instanceof Error ? err.message : "Please try again."); }
  }
  if (state === "done") return <p className="mk-ok">You're on the list. We'll email you when it opens.</p>;
  return (
    <form className={`mk-wait ${compact ? "compact" : ""}`} onSubmit={submit}>
      {!compact && <input aria-label="First name" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}
      <input aria-label="Email" type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
      <button className="btn primary" type="submit" disabled={state === "busy"}>{state === "busy" ? "Adding…" : cta}</button>
      {error && <p className="mk-err">{error}</p>}
    </form>
  );
}
