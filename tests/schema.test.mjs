// Schema accept/reject tests against the project JSON schemas (draft 2020-12).
// Run: node tests/schema.test.mjs   (requires devDeps: ajv, ajv-formats)
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
const load = (p) => JSON.parse(readFileSync(new URL(`../schemas/${p}`, import.meta.url), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema([load("user-profile.schema.json"), load("opportunity.schema.json"),
               load("blueprint.schema.json"), load("discovery-output.schema.json")]);
const disc = ajv.getSchema("https://369degrees.co.za/schemas/discovery-output.schema.json");
const bp = ajv.getSchema("https://369degrees.co.za/schemas/blueprint.schema.json");
let fail = [];
const check = (n, v, d, e) => { const ok = v(d); if (ok !== e) fail.push(n); console.log(`  ${ok===e?"OK":"FAIL"}  ${n}`); };

const validDisc = { userProfile: { skills: ["editing"] },
  productOpportunities: [{ name: "x", targetBuyer: "b", problem: "p", outcome: "o", productFormat: "guide" }] };
check("discovery valid", disc, validDisc, true);
check("discovery bad enum", disc, { ...validDisc, productOpportunities: [{ ...validDisc.productOpportunities[0], productFormat: "zzz" }] }, false);
check("discovery missing userProfile", disc, { productOpportunities: [] }, false);

const validBp = { product: { name: "n", concept: "c", format: "guide" },
  buyer: { targetCustomer: "t", problem: "p", desiredOutcome: "d" }, pricing: { reasoning: "r" } };
check("blueprint valid", bp, validBp, true);
check("blueprint missing product.name", bp, { ...validBp, product: { concept: "c" } }, false);
check("blueprint bad format enum", bp, { ...validBp, product: { name: "n", concept: "c", format: "zzz" } }, false);

console.log(fail.length ? `\nSCHEMA FAILURES: ${fail}` : "\nSCHEMA TESTS PASSED");
process.exit(fail.length ? 1 : 0);
