// Formula evaluator + content validation for the product system. Run: node tests/catalog.test.mjs
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { transformSync } from "esbuild";

const src = readFileSync(new URL("../src/features/catalog/formula.ts", import.meta.url), "utf8");
const js = transformSync(src, { loader: "ts", format: "esm" }).code;
const { evaluate } = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));

let fail = 0;
const eq = (name, got, want) => { const ok = Object.is(got, want); if (!ok) fail++; console.log(`  ${ok ? "OK " : "BAD"} ${name} → ${got}${ok ? "" : ` (want ${want})`}`); };
eq("target - current", evaluate("target - current", { target: 1200, current: 300 }), 900);
eq("sinking per period", evaluate("(target - current) / periods_left", { target: 1200, current: 300, periods_left: 6 }), 150);
eq("divide by zero is blank", evaluate("(target - current) / periods_left", { target: 1200, current: 300, periods_left: 0 }), null);
eq("all inputs blank is blank", evaluate("planned - actual", {}), null);
eq("one blank counts as 0", evaluate("planned - actual", { planned: 500 }), 500);
eq("annualise", evaluate("amount * periods_per_year", { amount: "99.5", periods_per_year: 12 }), 1194);
eq("rounding", evaluate("a / b", { a: 10, b: 3 }), 3.33);
eq("rejects code", evaluate("alert(1)", { alert: 1 }), null);

for (const f of ["adhd-system", "budgeting-system"]) {
  const out = execFileSync("python3", ["scripts/content/validate.py", `supabase/seed/products/${f}.json`], { encoding: "utf8" });
  const ok = out.startsWith("OK"); if (!ok) fail++;
  console.log(`  ${ok ? "OK " : "BAD"} content ${f}: ${out.split("\n")[0]}`);
}
console.log(fail ? "\nCATALOG TESTS FAILED" : "\nCATALOG TESTS PASSED");
process.exit(fail ? 1 : 0);
