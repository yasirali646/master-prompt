import { readFileSync } from "fs";
import path from "path";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type LanguageModel } from "ai";
import type { AppConfig, Provider } from "./config-types";
import { verbosityHint } from "./config-types";
import { resolveProviderSettings } from "./providers";
import type { StreamOptions } from "./stream-utils";

const META_PROMPT_PATH = path.join(process.cwd(), "lib", "prompts", "meta_prompt.txt");

function loadSystemPrompt(): string {
  return readFileSync(META_PROMPT_PATH, "utf-8");
}

const IMPORT_META = `You are a Master Prompt Analyst. Given an existing system prompt, restructure it into a strict state-machine master prompt format with:
- Engine title
- CORE BEHAVIOUR RULES (STRICT)
- Domain-specific critical rules
- SYSTEM FLOW with STATE N -> Label
- Per-state blocks ending with "Then STOP."
- FINAL RULES
- START

Output ONLY the restructured master prompt. No preamble.`;

const REFINE_META = `You are refining an existing master prompt. Apply the user's refinement instruction while preserving the state-machine structure, strict stop/wait rules, and overall format. Output ONLY the complete refined master prompt.`;

function getModel(
  provider: Provider,
  model: string,
  apiKey: string
): LanguageModel {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "groq":
      return createGroq({ apiKey })(model);
  }
}

export function createStream(
  idea: string,
  config: AppConfig,
  options?: StreamOptions
) {
  const { provider, model, apiKey } = resolveProviderSettings(
    config,
    options?.provider,
    options?.model,
    options?.apiKeys
  );
  const hint = verbosityHint(config.verbosity);
  const system = loadSystemPrompt() + (hint ? `\n\nVERBOSITY: ${hint}` : "");

  return streamText({
    model: getModel(provider, model, apiKey),
    system,
    prompt: idea.trim(),
    temperature: options?.temperature ?? config.temperature,
    maxTokens: options?.maxTokens ?? config.max_tokens ?? undefined,
  });
}

export function createRefineStream(
  idea: string,
  currentOutput: string,
  instruction: string,
  config: AppConfig,
  options?: StreamOptions
) {
  const { provider, model, apiKey } = resolveProviderSettings(
    config,
    options?.provider,
    options?.model,
    options?.apiKeys
  );

  return streamText({
    model: getModel(provider, model, apiKey),
    system: REFINE_META,
    prompt: `Original idea:\n${idea}\n\nCurrent master prompt:\n${currentOutput}\n\nRefinement instruction:\n${instruction}`,
    temperature: options?.temperature ?? config.temperature,
    maxTokens: options?.maxTokens ?? config.max_tokens ?? undefined,
  });
}

export function createImportStream(
  existingPrompt: string,
  config: AppConfig,
  options?: StreamOptions
) {
  const { provider, model, apiKey } = resolveProviderSettings(
    config,
    options?.provider,
    options?.model,
    options?.apiKeys
  );

  return streamText({
    model: getModel(provider, model, apiKey),
    system: IMPORT_META,
    prompt: existingPrompt.trim(),
    temperature: options?.temperature ?? config.temperature,
  });
}

export function createTestStream(
  masterPrompt: string,
  userMessage: string,
  config: AppConfig,
  options?: StreamOptions
) {
  const { provider, model, apiKey } = resolveProviderSettings(
    config,
    options?.provider,
    options?.model,
    options?.apiKeys
  );

  return streamText({
    model: getModel(provider, model, apiKey),
    system: masterPrompt,
    prompt: userMessage || "Hello",
    temperature: 0.3,
    maxTokens: 500,
  });
}

export { validateOutput } from "./validation";
