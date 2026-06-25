import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { execute, query } from "./db";
import type { DataScope } from "./data-scope";

export interface UsageRecord {
  id: string;
  type: "generate" | "refine" | "import" | "test";
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt: string;
}

export interface UsageSummary {
  totalGenerations: number;
  totalTokens: number;
  byProvider: Record<string, { count: number; tokens: number }>;
  recent: UsageRecord[];
  estimatedCostUsd: number;
}

const COST_PER_1M: Record<string, number> = {
  openai: 5,
  anthropic: 3,
  google: 2,
  groq: 0.5,
};

interface UsageRow extends RowDataPacket {
  id: string;
  type: UsageRecord["type"];
  provider: string;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  created_at: Date;
}

function mapUsage(row: UsageRow): UsageRecord {
  return {
    id: row.id,
    type: row.type,
    provider: row.provider,
    model: row.model,
    promptTokens: row.prompt_tokens ?? undefined,
    completionTokens: row.completion_tokens ?? undefined,
    totalTokens: row.total_tokens ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function recordUsage(
  scope: DataScope,
  record: Omit<UsageRecord, "id" | "createdAt">
): Promise<void> {
  const workspaceId = scope.kind === "workspace" ? scope.workspaceId : null;
  await execute(
    `INSERT INTO usage_records
      (id, user_id, workspace_id, type, provider, model, prompt_tokens, completion_tokens, total_tokens, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      scope.userId,
      workspaceId,
      record.type,
      record.provider,
      record.model,
      record.promptTokens ?? null,
      record.completionTokens ?? null,
      record.totalTokens ?? null,
      new Date().toISOString(),
    ]
  );
}

export async function getUsageSummary(scope: DataScope): Promise<UsageSummary> {
  const rows =
    scope.kind === "workspace"
      ? await query<UsageRow>(
          `SELECT id, type, provider, model, prompt_tokens, completion_tokens, total_tokens, created_at
           FROM usage_records WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 500`,
          [scope.workspaceId]
        )
      : await query<UsageRow>(
          `SELECT id, type, provider, model, prompt_tokens, completion_tokens, total_tokens, created_at
           FROM usage_records WHERE user_id = ? AND workspace_id IS NULL ORDER BY created_at DESC LIMIT 500`,
          [scope.userId]
        );
  const records = rows.map(mapUsage);
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
