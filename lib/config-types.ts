export const SUPPORTED_PROVIDERS = [
  "openai",
  "anthropic",
  "google",
  "groq",
] as const;
export type Provider = (typeof SUPPORTED_PROVIDERS)[number];

export type Verbosity = "concise" | "standard" | "detailed";

export interface AppConfig {
  provider: Provider;
  model: string | null;
  temperature: number;
  max_tokens: number | null;
  verbosity: Verbosity;
}

export function defaultConfig(): AppConfig {
  return {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: 0.7,
    max_tokens: null,
    verbosity: "standard",
  };
}

export interface ApiKeysPayload {
  openai_api_key?: string | null;
  anthropic_api_key?: string | null;
  google_api_key?: string | null;
  groq_api_key?: string | null;
}

export function resolveApiKey(
  _config: AppConfig,
  provider?: Provider,
  requestKeys?: ApiKeysPayload | null
): string | null {
  const p = provider ?? _config.provider;
  if (!requestKeys) return null;

  const fromRequest: Record<Provider, string | null | undefined> = {
    openai: requestKeys.openai_api_key,
    anthropic: requestKeys.anthropic_api_key,
    google: requestKeys.google_api_key,
    groq: requestKeys.groq_api_key,
  };

  const key = fromRequest[p];
  return key?.trim() ? key.trim() : null;
}

export function maskedConfig(config: AppConfig) {
  return {
    provider: config.provider,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.max_tokens,
    verbosity: config.verbosity,
    supported_providers: SUPPORTED_PROVIDERS,
    keys_stored_in: "browser",
  };
}

export function verbosityHint(verbosity: Verbosity): string {
  switch (verbosity) {
    case "concise":
      return "Keep states minimal (6-8 states). Short, tight instructions.";
    case "detailed":
      return "Use 10-12 states with rich per-state rules and examples.";
    default:
      return "";
  }
}
