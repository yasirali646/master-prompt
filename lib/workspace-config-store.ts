import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import type { AppConfig } from "./config-types";
import { defaultConfig } from "./config-types";
import { execute, query } from "./db";
import { normalizeModel } from "./providers";

interface ConfigRow extends RowDataPacket {
  provider: AppConfig["provider"];
  model: string | null;
  temperature: number;
  max_tokens: number | null;
  verbosity: AppConfig["verbosity"];
}

function mapConfig(row: ConfigRow): AppConfig {
  const config: AppConfig = {
    provider: row.provider,
    model: row.model,
    temperature: Number(row.temperature),
    max_tokens: row.max_tokens,
    verbosity: row.verbosity,
  };
  config.model = normalizeModel(config.provider, config.model);
  return config;
}

export async function loadWorkspaceConfig(workspaceId: string): Promise<AppConfig> {
  const rows = await query<ConfigRow>(
    "SELECT provider, model, temperature, max_tokens, verbosity FROM workspace_config WHERE workspace_id = ? LIMIT 1",
    [workspaceId]
  );
  if (!rows[0]) return defaultConfig();
  return mapConfig(rows[0]);
}

export async function saveWorkspaceConfig(workspaceId: string, config: AppConfig): Promise<void> {
  await execute(
    `INSERT INTO workspace_config (workspace_id, provider, model, temperature, max_tokens, verbosity)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       provider = VALUES(provider),
       model = VALUES(model),
       temperature = VALUES(temperature),
       max_tokens = VALUES(max_tokens),
       verbosity = VALUES(verbosity)`,
    [
      workspaceId,
      config.provider,
      config.model,
      config.temperature,
      config.max_tokens,
      config.verbosity,
    ]
  );
}
