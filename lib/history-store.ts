import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { analyzeQuality } from "./quality";
import { execute, query } from "./db";
import type { DataScope } from "./data-scope";

export interface HistoryEntry {
  id: string;
  idea: string;
  output: string;
  provider: string;
  model: string | null;
  createdAt: string;
  missingSections: string[];
  qualityScore: number;
  versions?: { output: string; instruction?: string; createdAt: string }[];
}

interface HistoryRow extends RowDataPacket {
  id: string;
  idea: string;
  output: string;
  provider: string;
  model: string | null;
  missing_sections: string[] | string;
  quality_score: number;
  versions: HistoryEntry["versions"] | string | null;
  created_at: Date;
}

function parseJson<T>(value: T | string | null): T | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value as T;
}

function mapHistory(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    idea: row.idea,
    output: row.output,
    provider: row.provider,
    model: row.model,
    createdAt: new Date(row.created_at).toISOString(),
    missingSections: parseJson<string[]>(row.missing_sections) ?? [],
    qualityScore: row.quality_score,
    versions: parseJson<HistoryEntry["versions"]>(row.versions),
  };
}

export async function listHistory(scope: DataScope): Promise<HistoryEntry[]> {
  const rows =
    scope.kind === "workspace"
      ? await query<HistoryRow>(
          `SELECT id, idea, output, provider, model, missing_sections, quality_score, versions, created_at
           FROM history WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 200`,
          [scope.workspaceId]
        )
      : await query<HistoryRow>(
          `SELECT id, idea, output, provider, model, missing_sections, quality_score, versions, created_at
           FROM history WHERE user_id = ? AND workspace_id IS NULL ORDER BY created_at DESC LIMIT 200`,
          [scope.userId]
        );
  return rows.map(mapHistory);
}

export async function getHistoryEntry(scope: DataScope, id: string): Promise<HistoryEntry | null> {
  const rows =
    scope.kind === "workspace"
      ? await query<HistoryRow>(
          `SELECT id, idea, output, provider, model, missing_sections, quality_score, versions, created_at
           FROM history WHERE workspace_id = ? AND id = ? LIMIT 1`,
          [scope.workspaceId, id]
        )
      : await query<HistoryRow>(
          `SELECT id, idea, output, provider, model, missing_sections, quality_score, versions, created_at
           FROM history WHERE user_id = ? AND workspace_id IS NULL AND id = ? LIMIT 1`,
          [scope.userId, id]
        );
  return rows[0] ? mapHistory(rows[0]) : null;
}

export async function saveHistoryEntry(
  scope: DataScope,
  entry: Omit<HistoryEntry, "id" | "createdAt" | "missingSections" | "qualityScore"> & {
    id?: string;
    versions?: HistoryEntry["versions"];
  }
): Promise<HistoryEntry> {
  const quality = analyzeQuality(entry.output);
  const full: HistoryEntry = {
    id: entry.id ?? crypto.randomUUID(),
    idea: entry.idea,
    output: entry.output,
    provider: entry.provider,
    model: entry.model,
    createdAt: new Date().toISOString(),
    missingSections: quality.missing,
    qualityScore: quality.score,
    versions: entry.versions,
  };

  const workspaceId = scope.kind === "workspace" ? scope.workspaceId : null;

  await execute(
    `INSERT INTO history
      (id, user_id, workspace_id, idea, output, provider, model, missing_sections, quality_score, versions, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      idea = VALUES(idea),
      output = VALUES(output),
      provider = VALUES(provider),
      model = VALUES(model),
      missing_sections = VALUES(missing_sections),
      quality_score = VALUES(quality_score),
      versions = VALUES(versions)`,
    [
      full.id,
      scope.userId,
      workspaceId,
      full.idea,
      full.output,
      full.provider,
      full.model,
      JSON.stringify(full.missingSections),
      full.qualityScore,
      full.versions ? JSON.stringify(full.versions) : null,
      full.createdAt,
    ]
  );

  return full;
}

export async function deleteHistoryEntry(scope: DataScope, id: string): Promise<boolean> {
  const result =
    scope.kind === "workspace"
      ? await execute("DELETE FROM history WHERE workspace_id = ? AND id = ?", [
          scope.workspaceId,
          id,
        ])
      : await execute("DELETE FROM history WHERE user_id = ? AND workspace_id IS NULL AND id = ?", [
          scope.userId,
          id,
        ]);
  return result.affectedRows > 0;
}

export async function appendVersion(
  scope: DataScope,
  id: string,
  output: string,
  instruction?: string
): Promise<HistoryEntry | null> {
  const entry = await getHistoryEntry(scope, id);
  if (!entry) return null;

  const versions = entry.versions ?? [{ output: entry.output, createdAt: entry.createdAt }];
  versions.push({ output, instruction, createdAt: new Date().toISOString() });
  const quality = analyzeQuality(output);

  const whereSql =
    scope.kind === "workspace"
      ? "workspace_id = ? AND id = ?"
      : "user_id = ? AND workspace_id IS NULL AND id = ?";
  const whereParams =
    scope.kind === "workspace" ? [scope.workspaceId, id] : [scope.userId, id];

  await execute(
    `UPDATE history SET output = ?, versions = ?, missing_sections = ?, quality_score = ?
     WHERE ${whereSql}`,
    [output, JSON.stringify(versions), JSON.stringify(quality.missing), quality.score, ...whereParams]
  );

  return {
    ...entry,
    output,
    versions,
    missingSections: quality.missing,
    qualityScore: quality.score,
  };
}
