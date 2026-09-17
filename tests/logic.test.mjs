// Bundles the pure edge modules with esbuild and asserts their behaviour.
// Run: node tests/logic.test.mjs   (requires devDep: esbuild)
import { build } from "esbuild";
async function loadTs(rel) {
  const res = await build({ entryPoints: [new URL(rel, import.meta.url).pathname],
    bundle: true, format: "esm", write: false, platform: "node" });
  return import("data:text/javascript;base64," + Buffer.from(res.outputFiles[0].text).toString("base64"));
}
let fail = [];
const ok = (n, cond) => { console.log(`  ${cond ? "OK" : "FAIL"}  ${n}`); if (!cond) fail.push(n); };

const rp = await loadTs("../supabase/functions/_shared/ai/resolveProvider.ts");
try { rp.resolveProvider({}); ok("no keys throws", false); }
catch (e) { ok("no keys -> MissingProviderConfigError", e instanceof rp.MissingProviderConfigError); }
ok("resolves anthropic", rp.resolveProvider({ ANTHROPIC_API_KEY: "x" }) === "anthropic");
ok("resolves openai when only openai", rp.resolveProvider({ OPENAI_API_KEY: "x" }) === "openai");

const vb = await loadTs("../supabase/functions/_shared/builder/validateRequest.ts");
ok("valid generate", vb.validateBuilderRequest({ action: "generate", productId: "p", phase: "strategy" }).valid);
ok("unknown action", vb.validateBuilderRequest({ action: "x" }).error === "unknown_action");
ok("missing productId", vb.validateBuilderRequest({ action: "get" }).error === "missing_product_id");
ok("invalid phase", vb.validateBuilderRequest({ action: "generate", productId: "p", phase: "z" }).error === "invalid_phase");

console.log(fail.length ? `\nLOGIC FAILURES: ${fail}` : "\nLOGIC TESTS PASSED");
process.exit(fail.length ? 1 : 0);
