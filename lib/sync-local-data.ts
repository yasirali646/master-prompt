import "server-only";

import type { AppConfig } from "./config-types";
import { defaultConfig } from "./config-types";
import { saveConfig } from "./config-store";
import { saveHistoryEntry } from "./history-store";
import { saveTemplate } from "./templates";
import { recordUsage } from "./usage-store";
import type { LocalDataExport } from "./client-data";
import { normalizeModel } from "./providers";

export async function syncLocalDataToUser(userId: string, data: LocalDataExport): Promise<void> {
  if (data.config && Object.keys(data.config).length > 0) {
    const merged = { ...defaultConfig(), ...data.config };
    merged.model = normalizeModel(merged.provider, merged.model);
    await saveConfig(userId, merged);
  }

  if (data.history?.length) {
    const personalScope = { kind: "personal" as const, userId };
    for (const entry of data.history) {
      await saveHistoryEntry(personalScope, {
        id: entry.id,
        idea: entry.idea,
        output: entry.output,
        provider: entry.provider,
        model: entry.model,
        versions: entry.versions,
      });
    }
  }

  if (data.templates?.length) {
    const personalScope = { kind: "personal" as const, userId };
    for (const template of data.templates) {
      await saveTemplate(personalScope, template.label, template.idea);
    }
  }

  if (data.usage?.length) {
    const personalScope = { kind: "personal" as const, userId };
    for (const record of data.usage) {
      await recordUsage(personalScope, {
        type: record.type,
        provider: record.provider,
        model: record.model,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
      });
    }
  }
}
