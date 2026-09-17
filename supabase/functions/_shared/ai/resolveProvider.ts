// Pure, runtime-agnostic AI provider resolution (no Deno/browser imports so it
// is unit-testable). Decides which provider to use based on which keys exist.
export type AIProviderName = "openai" | "anthropic" | "perplexity";

export class MissingProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingProviderConfigError";
  }
}

const KEY_ENV: Record<AIProviderName, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
};

/** Returns the provider to use, or throws an honest config error. */
export function resolveProvider(
  env: Record<string, string | undefined>,
  requested?: AIProviderName,
): AIProviderName {
  const order: AIProviderName[] = requested
    ? [requested]
    : ["anthropic", "openai", "perplexity"];
  for (const p of order) {
    const key = env[KEY_ENV[p]];
    if (key && key.trim().length > 0) return p;
  }
  throw new MissingProviderConfigError(
    requested
      ? `AI provider '${requested}' is not configured (missing ${KEY_ENV[requested]}).`
      : "No AI provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY or PERPLEXITY_API_KEY.",
  );
}
