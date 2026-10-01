/**
 * Safe arithmetic for table formula columns: identifiers (other columns in the
 * same row), numbers, + - * / and parentheses. No eval, no functions.
 * Blank inputs count as 0 (like a spreadsheet); if every referenced input is
 * blank the result is blank. Division by zero gives blank.
 */
type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /\s*(?:(\d+(?:\.\d+)?)|([a-z_][a-z0-9_]*)|([+\-*/()]))/gy;
  let m: RegExpExecArray | null;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    m = re.exec(src);
    if (!m) { if (/^\s*$/.test(src.slice(pos))) break; throw new Error("bad formula"); }
    if (m[1] !== undefined) out.push({ t: "num", v: parseFloat(m[1]) });
    else if (m[2] !== undefined) out.push({ t: "id", v: m[2] });
    else if (m[3] !== undefined) out.push({ t: "op", v: m[3] });
    pos = re.lastIndex;
  }
  return out;
}

export function formulaRefs(src: string): string[] {
  try { return tokenize(src).filter((t) => t.t === "id").map((t) => t.v as string); } catch { return []; }
}

export function evaluate(src: string, row: Record<string, unknown>): number | null {
  let toks: Tok[];
  try { toks = tokenize(src); } catch { return null; }
  const refs = toks.filter((t) => t.t === "id").map((t) => t.v as string);
  const num = (id: string): number => {
    const v = row[id];
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : 0;
  };
  if (refs.length && refs.every((id) => row[id] === undefined || row[id] === null || row[id] === "")) return null;

  let i = 0;
  const peek = () => toks[i];
  function expr(): number { let v = term(); while (peek()?.t === "op" && (peek()!.v === "+" || peek()!.v === "-")) { const op = toks[i++].v; const r = term(); v = op === "+" ? v + r : v - r; } return v; }
  function term(): number { let v = factor(); while (peek()?.t === "op" && (peek()!.v === "*" || peek()!.v === "/")) { const op = toks[i++].v; const r = factor(); if (op === "/") { if (r === 0) throw new Error("div0"); v = v / r; } else v = v * r; } return v; }
  function factor(): number {
    const tk = toks[i++];
    if (!tk) throw new Error("eof");
    if (tk.t === "num") return tk.v as number;
    if (tk.t === "id") return num(tk.v as string);
    if (tk.v === "-") return -factor();
    if (tk.v === "(") { const v = expr(); if (toks[i++]?.v !== ")") throw new Error("paren"); return v; }
    throw new Error("unexpected");
  }
  try {
    const v = expr();
    if (i !== toks.length || !Number.isFinite(v)) return null;
    return Math.round(v * 100) / 100;
  } catch { return null; }
}
