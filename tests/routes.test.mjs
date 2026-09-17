// Verifies the expected routes are registered. Run: node tests/routes.test.mjs
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../src/router.tsx", import.meta.url), "utf8");
const found = [...src.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
const expected = [
  "/", "/how-it-works", "/discover", "/discover/results", "/blueprint", "/builder",
  "/marketplace", "/workforce", "/book-a-call", "/login", "/get-started",
  "/dashboard", "/products", "/products/:productId", "/products/:productId/builder",
  "/ai-guide", "/content", "/tools", "/affiliate", "/settings", "*",
];
const missing = expected.filter((p) => !found.includes(p));
console.log(`  routes found: ${found.length}`);
if (missing.length) { console.log(`  MISSING: ${missing}`); console.log("\nROUTE TESTS FAILED"); process.exit(1); }
console.log("\nROUTE TESTS PASSED");
