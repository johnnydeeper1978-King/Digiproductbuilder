// Validates AI output against the project's JSON schemas (Deno, draft 2020-12).
// The four schemas are the source of truth (schemas/*.json). Non-conforming
// output is rejected, never coerced.
import Ajv2020 from "npm:ajv@8/dist/2020.js";
import addFormats from "npm:ajv-formats@2";

import userProfile from "../../../../schemas/user-profile.schema.json" with { type: "json" };
import opportunity from "../../../../schemas/opportunity.schema.json" with { type: "json" };
import blueprint from "../../../../schemas/blueprint.schema.json" with { type: "json" };
import discoveryOutput from "../../../../schemas/discovery-output.schema.json" with { type: "json" };

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema([userProfile, opportunity, blueprint, discoveryOutput]);

export interface ValidationResult { valid: boolean; errors: string[]; }

function make(id: string) {
  const validate = ajv.getSchema(id)!;
  return (data: unknown): ValidationResult => {
    const valid = validate(data) as boolean;
    const errors = (validate.errors ?? []).map(
      (e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim());
    return { valid, errors };
  };
}

export const validateDiscoveryOutputData = make(
  "https://369degrees.co.za/schemas/discovery-output.schema.json");
export const validateBlueprintData = make(
  "https://369degrees.co.za/schemas/blueprint.schema.json");
