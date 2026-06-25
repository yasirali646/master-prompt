import "server-only";

import { defaultConfig, type AppConfig } from "./config-types";
import { loadConfig } from "./config-store";
import { loadWorkspaceConfig } from "./workspace-config-store";
import type { DataScope } from "./data-scope";

export async function loadRequestConfig(
  userId: string | null,
  scope?: DataScope | null
): Promise<AppConfig> {
  if (!userId) return defaultConfig();
  if (scope?.kind === "workspace") return loadWorkspaceConfig(scope.workspaceId);
  return loadConfig(userId);
}

export async function loadScopedConfig(scope: DataScope): Promise<AppConfig> {
  if (scope.kind === "workspace") return loadWorkspaceConfig(scope.workspaceId);
  return loadConfig(scope.userId);
}

export async function saveScopedConfig(scope: DataScope, config: AppConfig): Promise<void> {
  if (scope.kind === "workspace") {
    const { saveWorkspaceConfig } = await import("./workspace-config-store");
    await saveWorkspaceConfig(scope.workspaceId, config);
    return;
  }
  const { saveConfig } = await import("./config-store");
  await saveConfig(scope.userId, config);
}
