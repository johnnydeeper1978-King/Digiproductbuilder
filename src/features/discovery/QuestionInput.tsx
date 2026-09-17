import { useState } from "react";
import type { Question, AnswerValue } from "./types";
import { cn } from "@/utils/cn";

export function QuestionInput({ q, value, onChange }:
  { q: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {

  if (q.type === "single-select") {
    return (
      <div className="opt-grid">
        {q.options!.map((o) => (
          <button key={o.value} type="button"
            className={cn("opt", value === o.value && "opt-active")}
            onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    );
  }
  if (q.type === "multi-select") {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (v: string) => onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    return (
      <div className="opt-grid">
        {q.options!.map((o) => (
          <button key={o.value} type="button"
            className={cn("opt", arr.includes(o.value) && "opt-active")}
            onClick={() => toggle(o.value)}>{o.label}</button>
        ))}
      </div>
    );
  }
  if (q.type === "tags") {
    return <TagInput value={Array.isArray(value) ? value : []} onChange={onChange} placeholder={q.placeholder} />;
  }
  return (
    <textarea className="d-textarea" rows={3} placeholder={q.placeholder}
      value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
  );
}

function TagInput({ value, onChange, placeholder }:
  { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div>
      <div className="row wrap" style={{ marginBottom: value.length ? 10 : 0 }}>
        {value.map((t) => (
          <span key={t} className="tag">{t}
            <button type="button" className="tag-x" onClick={() => onChange(value.filter((x) => x !== t))}>×</button>
          </span>
        ))}
      </div>
      <input className="d-input" placeholder={placeholder} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add} />
      <p className="dim" style={{ fontSize: "0.78rem", marginTop: 6 }}>Press Enter to add each one.</p>
    </div>
  );
}
