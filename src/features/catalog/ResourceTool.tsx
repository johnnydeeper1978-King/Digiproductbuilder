import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormField, ResourceDef, TableColumn } from "./types";
import { evaluate } from "./formula";

type Row = Record<string, unknown> & { _id: string; _example?: boolean };
type Data = { fields?: Record<string, unknown>; rows?: Row[]; checked?: Record<string, boolean> };
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Interactive worksheet / tracker / checklist / builder. Autosaves. */
export function ResourceTool({ def, initial, onSave, savedAt }: {
  def: ResourceDef;
  initial: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<string>;
  savedAt?: string | null;
}) {
  const c = def.content;
  const [data, setData] = useState<Data>(() => initialData(def, initial));
  const [state, setState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(savedAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(data);
  latest.current = data;

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    setState("saving"); setError(null);
    try {
      const at = await onSave(latest.current as Record<string, unknown>);
      setLastSaved(at); setState("saved");
    } catch (e) {
      setState("error"); setError(e instanceof Error ? e.message : "Couldn't save.");
    }
  }, [onSave]);

  const update = (fn: (d: Data) => Data) => {
    setData((d) => fn(d));
    setState("dirty");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void save(); }, 1500);
  };

  // Save pending edits when leaving the page.
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (state === "dirty" || state === "saving") { e.preventDefault(); } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [state]);

  return (
    <div className="rt">
      {c.intro && <p className="rt-intro">{c.intro}</p>}

      {(c.type === "form" || c.type === "builder") && (
        <div className="rt-form">
          {c.fields.map((f) => (
            <FieldInputView key={f.id} f={f} value={data.fields?.[f.id]}
              onChange={(v) => update((d) => ({ ...d, fields: { ...(d.fields ?? {}), [f.id]: v } }))} />
          ))}
        </div>
      )}

      {c.type === "checklist" && (
        <ul className="rt-check">
          {c.items.map((item, i) => {
            const on = Boolean(data.checked?.[String(i)]);
            return (
              <li key={i}>
                <label>
                  <input type="checkbox" checked={on}
                    onChange={() => update((d) => ({ ...d, checked: { ...(d.checked ?? {}), [String(i)]: !on } }))} />
                  <span>{item}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {c.type === "table" && (
        <TableView columns={c.columns} rows={data.rows ?? []} totals={c.totals ?? []} groupBy={c.group_by}
          onChange={(rows) => update((d) => ({ ...d, rows }))} />
      )}
      {c.type === "table" && c.formula_notes && (
        <details className="rt-notes"><summary>How the calculations work</summary><p>{c.formula_notes}</p></details>
      )}

      <div className="rt-bar">
        <span className={`rt-status rt-${state}`}>
          {state === "saving" ? "Saving…" : state === "dirty" ? "Unsaved changes" : state === "error" ? (error ?? "Couldn't save")
            : lastSaved ? `Saved ${new Date(lastSaved).toLocaleString()}` : "Not saved yet"}
        </span>
        <div className="rt-actions">
          <button type="button" className="btn outline" onClick={() => downloadCsv(def, data)}>Download CSV</button>
          <button type="button" className="btn primary" onClick={() => void save()} disabled={state === "saving"}>Save</button>
        </div>
      </div>
    </div>
  );
}

function initialData(def: ResourceDef, initial: Record<string, unknown> | null): Data {
  const c = def.content;
  if (initial && typeof initial === "object") {
    const d = initial as Data;
    if (c.type === "table" && Array.isArray(d.rows)) return { rows: d.rows.map((r) => ({ ...r, _id: String(r._id ?? uid()) })) };
    return d;
  }
  if (c.type === "table") {
    const examples = (c.starter_rows ?? []).map((r) => ({ ...r, _id: uid(), _example: true }) as Row);
    return { rows: examples.length ? [...examples, blankRow()] : [blankRow(), blankRow(), blankRow()] };
  }
  return {};
}
const blankRow = (): Row => ({ _id: uid() });

function FieldInputView({ f, value, onChange }: { f: FormField; value: unknown; onChange: (v: unknown) => void }) {
  const id = `f-${f.id}`;
  return (
    <div className="rt-field">
      <label htmlFor={id}>{f.label}</label>
      {f.help && <small className="rt-help">{f.help}</small>}
      {f.input === "textarea" && (
        <textarea id={id} rows={4} value={str(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {(f.input === "text" || f.input === "date") && (
        <input id={id} type={f.input === "date" ? "date" : "text"} value={str(value)} placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)} />
      )}
      {(f.input === "number" || f.input === "currency") && (
        <input id={id} type="number" inputMode="decimal" step="any" value={str(value)} placeholder={f.placeholder ?? (f.input === "currency" ? "Amount in your currency" : "")}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
      )}
      {f.input === "select" && (
        <select id={id} value={str(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {f.input === "rating" && (
        <div className="rt-rating" role="radiogroup" aria-label={f.label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={value === n}
              className={value === n ? "on" : ""} onClick={() => onChange(value === n ? "" : n)}>{n}</button>
          ))}
          {!f.help && <span className="rt-scale">1 = low · 5 = high</span>}
        </div>
      )}
      {f.input === "list" && <ListInput id={id} value={Array.isArray(value) ? value.map(String) : []} placeholder={f.placeholder} onChange={onChange} />}
    </div>
  );
}

function ListInput({ id, value, placeholder, onChange }: { id: string; value: string[]; placeholder?: string; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...value, v]); setDraft(""); };
  return (
    <div className="rt-list">
      {value.length > 0 && (
        <ul>
          {value.map((v, i) => (
            <li key={i}><span>{v}</span>
              <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button></li>
          ))}
        </ul>
      )}
      <div className="rt-list-add">
        <input id={id} type="text" value={draft} placeholder={placeholder ?? "Type and press Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="btn outline" onClick={add}>Add</button>
      </div>
    </div>
  );
}

function TableView({ columns, rows, totals, groupBy, onChange }: {
  columns: TableColumn[]; rows: Row[]; totals: string[]; groupBy?: string; onChange: (rows: Row[]) => void;
}) {
  const computed = useMemo(() => rows.map((r) => {
    const out: Row = { ...r };
    for (const col of columns) if (col.formula) out[col.id] = evaluate(col.formula, r);
    return out;
  }), [rows, columns]);

  const set = (id: string, col: string, v: unknown) =>
    onChange(rows.map((r) => (r._id === id ? { ...r, [col]: v, _example: false } : r)));
  const sum = (rs: Row[], col: string) => {
    let s = 0; let any = false;
    for (const r of rs) { const n = Number(r[col]); if (r[col] !== "" && r[col] !== null && r[col] !== undefined && Number.isFinite(n)) { s += n; any = true; } }
    return any ? Math.round(s * 100) / 100 : null;
  };
  const groups = groupBy
    ? [...new Set(computed.map((r) => String(r[groupBy] ?? "")).filter(Boolean))]
    : [];

  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.id}>{c.label}{c.formula && <span className="rt-calc" title={`= ${c.formula}`}>calc</span>}</th>)}<th aria-label="Row actions" /></tr>
        </thead>
        <tbody>
          {computed.map((r) => (
            <tr key={r._id} className={r._example ? "rt-example" : ""}>
              {columns.map((c) => (
                <td key={c.id} data-label={c.label}>
                  <Cell col={c} value={r[c.id]} onChange={(v) => set(r._id, c.id, v)} />
                </td>
              ))}
              <td className="rt-rowact">
                {r._example && <span className="rt-ex-tag">Example</span>}
                <button type="button" aria-label="Delete row" onClick={() => onChange(rows.filter((x) => x._id !== r._id))}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
        {(totals.length > 0) && (
          <tfoot>
            {groups.map((g) => (
              <tr key={g} className="rt-subtotal">
                {columns.map((c, i) => (
                  <td key={c.id}>{i === 0 ? `Subtotal · ${g}` : totals.includes(c.id) ? fmt(sum(computed.filter((r) => String(r[groupBy!] ?? "") === g), c.id)) : ""}</td>
                ))}<td />
              </tr>
            ))}
            <tr className="rt-total">
              {columns.map((c, i) => <td key={c.id}>{i === 0 ? "Total" : totals.includes(c.id) ? fmt(sum(computed, c.id)) : ""}</td>)}<td />
            </tr>
          </tfoot>
        )}
      </table>
      <button type="button" className="btn outline rt-addrow" onClick={() => onChange([...rows, blankRow()])}>+ Add row</button>
    </div>
  );
}

function Cell({ col, value, onChange }: { col: TableColumn; value: unknown; onChange: (v: unknown) => void }) {
  if (col.formula) return <span className="rt-out">{fmt(value as number | null)}</span>;
  switch (col.input) {
    case "checkbox": return <input type="checkbox" aria-label={col.label} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
    case "select": return (
      <select aria-label={col.label} value={str(value)} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>{(col.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>);
    case "number": case "currency": case "percent": return (
      <input aria-label={col.label} type="number" inputMode="decimal" step="any" value={str(value)}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />);
    case "date": return <input aria-label={col.label} type="date" value={str(value)} onChange={(e) => onChange(e.target.value)} />;
    default: return <input aria-label={col.label} type="text" value={str(value)} onChange={(e) => onChange(e.target.value)} />;
  }
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Spreadsheet-ready export of the user's own answers (generated in the browser). */
export function downloadCsv(def: ResourceDef, data: Data) {
  const c = def.content;
  let lines: string[] = [];
  if (c.type === "table") {
    const rows = (data.rows ?? []).filter((r) => !r._example && c.columns.some((col) => !col.formula && str(r[col.id]) !== ""));
    lines.push(c.columns.map((col) => csvCell(col.label)).join(","));
    for (const r of rows) {
      lines.push(c.columns.map((col) => csvCell(col.formula ? evaluate(col.formula, r) : r[col.id])).join(","));
    }
  } else if (c.type === "checklist") {
    lines = ["Item,Done", ...c.items.map((it, i) => `${csvCell(it)},${data.checked?.[String(i)] ? "Yes" : "No"}`)];
  } else {
    lines = ["Question,Answer", ...c.fields.map((f) => `${csvCell(f.label)},${csvCell(data.fields?.[f.id])}`)];
  }
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${def.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Read-only summary of a saved entry (used on the final OS page). */
export function EntrySummary({ def, data }: { def: ResourceDef; data: Record<string, unknown> | null }) {
  const c = def.content;
  const d = (data ?? {}) as Data;
  if (!data) return <p className="dim-note">Not filled in yet.</p>;
  if (c.type === "table") {
    const rows = (d.rows ?? []).filter((r) => !r._example && c.columns.some((col) => !col.formula && str(r[col.id]) !== ""));
    if (!rows.length) return <p className="dim-note">No rows yet.</p>;
    const cols = c.columns.slice(0, 4);
    return (
      <div className="rt-table-wrap"><table className="rt-table rt-readonly">
        <thead><tr>{cols.map((col) => <th key={col.id}>{col.label}</th>)}</tr></thead>
        <tbody>{rows.slice(0, 8).map((r) => <tr key={r._id}>{cols.map((col) => <td key={col.id}>{col.formula ? fmt(evaluate(col.formula, r)) : col.input === "checkbox" ? (r[col.id] ? "✓" : "") : str(r[col.id])}</td>)}</tr>)}</tbody>
      </table>{rows.length > 8 && <p className="dim-note">+ {rows.length - 8} more rows</p>}</div>
    );
  }
  if (c.type === "checklist") {
    const done = c.items.filter((_, i) => d.checked?.[String(i)]).length;
    return <p>{done} of {c.items.length} done</p>;
  }
  const filled = c.fields.filter((f) => {
    const v = d.fields?.[f.id];
    return Array.isArray(v) ? v.length > 0 : str(v).trim() !== "";
  });
  if (!filled.length) return <p className="dim-note">Not filled in yet.</p>;
  return (
    <dl className="rt-summary">
      {filled.map((f) => {
        const v = d.fields?.[f.id];
        return <div key={f.id}><dt>{f.label}</dt><dd>{Array.isArray(v) ? v.join(" · ") : str(v)}</dd></div>;
      })}
    </dl>
  );
}
