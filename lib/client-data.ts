/**
 * User data for guests is stored only in the browser (localStorage).
 * API keys are handled separately in client-api-keys.ts and are never synced.
 */

import type { AppConfig } from "./config-types";
import { defaultConfig } from "./config-types";
import { normalizeModel } from "./providers";
import type { HistoryEntry } from "./history-store";
import type { Template } from "./templates";
import type { UsageRecord, UsageSummary } from "./usage-store";
import { analyzeQuality } from "./quality";

const STORAGE = {
  config: "mp_config_v1",
  history: "mp_history_v1",
  templates: "mp_user_templates_v1",
  usage: "mp_usage_v1",
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadLocalConfig(): Promise<AppConfig & { keys_stored_in: "browser" }> {
  const stored = readJson<Partial<AppConfig>>(STORAGE.config, {});
  const config = { ...defaultConfig(), ...stored };
  config.model = normalizeModel(config.provider, config.model);
  return { ...config, keys_stored_in: "browser" };
}

export async function saveLocalConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  const merged = { ...(await loadLocalConfig()), ...config };
  const { keys_stored_in: _, ...toSave } = merged;
  writeJson(STORAGE.config, toSave);
  return merged;
}

export function listLocalHistory(): HistoryEntry[] {
  const entries = readJson<HistoryEntry[]>(STORAGE.history, []);
  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveLocalHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "createdAt" | "missingSections" | "qualityScore"> & {
    id?: string;
    missingSections?: string[];
    qualityScore?: number;
    versions?: HistoryEntry["versions"];
  }
): HistoryEntry {
  const entries = readJson<HistoryEntry[]>(STORAGE.history, []);
  const quality = analyzeQuality(entry.output);
  const full: HistoryEntry = {
    id: entry.id ?? crypto.randomUUID(),
    idea: entry.idea,
    output: entry.output,
    provider: entry.provider,
    model: entry.model,
    createdAt: new Date().toISOString(),
    missingSections: entry.missingSections ?? quality.missing,
    qualityScore: entry.qualityScore ?? quality.score,
    versions: entry.versions,
  };
  const idx = entries.findIndex((e) => e.id === full.id);
  if (idx >= 0) entries[idx] = full;
  else entries.unshift(full);
  writeJson(STORAGE.history, entries.slice(0, 200));
  return full;
}

export function deleteLocalHistoryEntry(id: string): boolean {
  const entries = readJson<HistoryEntry[]>(STORAGE.history, []);
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;
  writeJson(STORAGE.history, filtered);
  return true;
}

export function listLocalUserTemplates(): Template[] {
  return readJson<Template[]>(STORAGE.templates, []).map((t) => ({
    ...t,
    userCreated: true,
  }));
}

export function saveLocalTemplate(label: string, idea: string): Template {
  const templates = readJson<Template[]>(STORAGE.templates, []);
  const t: Template = {
    id: crypto.randomUUID(),
    label,
    idea,
    userCreated: true,
  };
  templates.push(t);
  writeJson(STORAGE.templates, templates);
  return t;
}

export function deleteLocalTemplate(id: string): boolean {
  const templates = readJson<Template[]>(STORAGE.templates, []);
  const filtered = templates.filter((t) => t.id !== id);
  if (filtered.length === templates.length) return false;
  writeJson(STORAGE.templates, filtered);
  return true;
}

export function recordLocalUsage(
  record: Omit<UsageRecord, "id" | "createdAt">
): void {
  const records = readJson<UsageRecord[]>(STORAGE.usage, []);
  records.unshift({
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  writeJson(STORAGE.usage, records.slice(0, 500));
}

const COST_PER_1M: Record<string, number> = {
  openai: 5,
  anthropic: 3,
  google: 2,
  groq: 0.5,
};

export function getLocalUsageSummary(): UsageSummary {
  const records = readJson<UsageRecord[]>(STORAGE.usage, []);
  const byProvider: Record<string, { count: number; tokens: number }> = {};
  let totalTokens = 0;

  for (const r of records) {
    const tokens = r.totalTokens ?? 0;
    totalTokens += tokens;
    if (!byProvider[r.provider]) byProvider[r.provider] = { count: 0, tokens: 0 };
    byProvider[r.provider].count++;
    byProvider[r.provider].tokens += tokens;
  }

  let estimatedCostUsd = 0;
  for (const [provider, data] of Object.entries(byProvider)) {
    const rate = COST_PER_1M[provider] ?? 3;
    estimatedCostUsd += (data.tokens / 1_000_000) * rate;
  }

  return {
    totalGenerations: records.filter((r) => r.type === "generate").length,
    totalTokens,
    byProvider,
    recent: records.slice(0, 20),
    estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
  };
}

export interface LocalDataExport {
  hasData: boolean;
  config?: Partial<AppConfig>;
  history?: HistoryEntry[];
  templates?: Template[];
  usage?: UsageRecord[];
}

export function exportLocalData(): LocalDataExport {
  const config = readJson<Partial<AppConfig>>(STORAGE.config, {});
  const history = readJson<HistoryEntry[]>(STORAGE.history, []);
  const templates = readJson<Template[]>(STORAGE.templates, []);
  const usage = readJson<UsageRecord[]>(STORAGE.usage, []);
  const hasData =
    Object.keys(config).length > 0 ||
    history.length > 0 ||
    templates.length > 0 ||
    usage.length > 0;
  return {
    hasData,
    config: Object.keys(config).length ? config : undefined,
    history: history.length ? history : undefined,
    templates: templates.length ? templates : undefined,
    usage: usage.length ? usage : undefined,
  };
}

export function clearLocalUserData(): void {
  localStorage.removeItem(STORAGE.config);
  localStorage.removeItem(STORAGE.history);
  localStorage.removeItem(STORAGE.templates);
  localStorage.removeItem(STORAGE.usage);
}
