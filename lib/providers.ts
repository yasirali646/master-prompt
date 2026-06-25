import type { ApiKeysPayload, AppConfig, Provider } from "./config-types";
import { resolveApiKey, SUPPORTED_PROVIDERS } from "./config-types";
import {
  PROVIDER_MODEL_CATALOG,
  type ProviderModelOption,
} from "./provider-model-catalog";

export type { ProviderModelOption };
export { PROVIDER_MODEL_CATALOG as PROVIDER_MODELS };

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-6",
  google: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google Gemini",
  groq: "Groq",
};

export function getModelsForProvider(provider: string): ProviderModelOption[] {
  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) return [];
  return PROVIDER_MODEL_CATALOG[provider as Provider];
}

export function getDefaultModel(provider: string): string {
  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    return DEFAULT_MODELS.anthropic;
  }
  return DEFAULT_MODELS[provider as Provider];
}

export function isValidModel(provider: string, model: string): boolean {
  return getModelsForProvider(provider).some((m) => m.id === model);
}

export function normalizeModel(provider: string, model?: string | null): string {
  const p = SUPPORTED_PROVIDERS.includes(provider as Provider)
    ? (provider as Provider)
    : "anthropic";
  if (model && isValidModel(p, model)) return model;
  return DEFAULT_MODELS[p];
}

export function assertProviderModel(provider: string, model?: string | null): string {
  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    throw new Error(
      `Unsupported provider '${provider}'. Choose from: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }
  const trimmed = model?.trim();
  if (!trimmed) {
    throw new Error("Model is required. Select a model for the chosen provider.");
  }
  if (!isValidModel(provider, trimmed)) {
    throw new Error(`Invalid model '${trimmed}' for provider '${provider}'.`);
  }
  return trimmed;
}

export function resolveModel(provider: Provider, model?: string | null): string {
  return assertProviderModel(provider, model ?? DEFAULT_MODELS[provider]);
}

export function resolveProviderSettings(
  config: AppConfig,
  provider?: Provider | null,
  model?: string | null,
  apiKeys?: ApiKeysPayload | null
): { provider: Provider; model: string; apiKey: string } {
  const activeProvider = provider || config.provider;
  if (!SUPPORTED_PROVIDERS.includes(activeProvider)) {
    throw new Error(
      `Unsupported provider '${activeProvider}'. Choose from: ${SUPPORTED_PROVIDERS.join(", ")}`
    );
  }
  const activeModel = resolveModel(
    activeProvider,
    model ?? config.model ?? DEFAULT_MODELS[activeProvider]
  );
  const apiKey = resolveApiKey(config, activeProvider, apiKeys);
  if (!apiKey) {
    throw new Error(
      `No API key for '${activeProvider}'. Add it in Settings → API Keys (stored locally in your browser).`
    );
  }
  return { provider: activeProvider, model: activeModel, apiKey };
}
