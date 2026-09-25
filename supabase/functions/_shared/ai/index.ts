// Server-side provider registry wiring (Deno). Registers the adapters and
// exposes a resolver that reads keys from Deno.env. Anthropic is live;
// OpenAI and Perplexity remain stubs that throw rather than fabricate output.
import { registerProvider, getProvider } from "./provider.ts";
import { openaiProvider } from "./openai.ts";
import { anthropicProvider } from "./anthropic.ts";
import { perplexityProvider } from "./perplexity.ts";
import { resolveProvider, type AIProviderName } from "./resolveProvider.ts";

registerProvider(openaiProvider);
registerProvider(anthropicProvider);
registerProvider(perplexityProvider);

/** Pick a configured provider from Deno.env (throws MissingProviderConfigError). */
export function selectProvider(requested?: AIProviderName) {
  const name = resolveProvider(Deno.env.toObject(), requested);
  return getProvider(name);
}
