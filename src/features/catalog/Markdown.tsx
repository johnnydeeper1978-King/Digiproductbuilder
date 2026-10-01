import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe markdown renderer for lesson content. Builds React elements
 * (never injects HTML). Supports paragraphs, **bold**, *italic*, "- " lists,
 * "1. " lists, "> " quotes and "### " headings — the subset our content uses.
 */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { i++; continue; }
    if (/^#{3,6} /.test(t)) {
      blocks.push(<h4 key={key++} className="md-h">{inline(t.replace(/^#+ /, ""))}</h4>);
      i++; continue;
    }
    if (/^- /.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      blocks.push(<ul key={key++} className="md-ul">{items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ul>);
      continue;
    }
    if (/^\d+[.)] /.test(t)) {
      const items: string[] = [];
      const start = parseInt(t, 10) || 1;
      while (i < lines.length && /^\d+[.)] /.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+[.)] /, "")); i++; }
      blocks.push(<ol key={key++} className="md-ol" start={start}>{items.map((x, j) => <li key={j}>{inline(x)}</li>)}</ol>);
      continue;
    }
    if (/^> ?/.test(t)) {
      const q: string[] = [];
      while (i < lines.length && /^> ?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^> ?/, "")); i++; }
      blocks.push(<blockquote key={key++} className="md-quote">{inline(q.join(" "))}</blockquote>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(- |\d+[.)] |> ?|#{3,6} )/.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
    blocks.push(<p key={key++}>{inline(para.join(" "))}</p>);
  }
  return <div className="md">{blocks}</div>;
}

function inline(s: string): ReactNode {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(<Fragment key={k++}>{s.slice(last, m.index)}</Fragment>);
    out.push(m[1] !== undefined ? <strong key={k++}>{m[1]}</strong> : <em key={k++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(<Fragment key={k++}>{s.slice(last)}</Fragment>);
  return out;
}
