import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { query } from "./db";

export async function isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
  const rows = await query<RowDataPacket & { cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM workspaces w
     LEFT JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
     WHERE w.id = ? AND (w.owner_id = ? OR wm.user_id IS NOT NULL)`,
    [userId, workspaceId, userId]
  );
  return (rows[0]?.cnt ?? 0) > 0;
}

export async function isWorkspaceOwner(userId: string, workspaceId: string): Promise<boolean> {
  const rows = await query<RowDataPacket & { cnt: number }>(
    "SELECT COUNT(*) AS cnt FROM workspaces WHERE id = ? AND owner_id = ?",
    [workspaceId, userId]
  );
  return (rows[0]?.cnt ?? 0) > 0;
}

export function getWorkspaceIdFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("workspaceId");
  if (fromQuery) return fromQuery;
  return request.headers.get("X-Workspace-Id");
}

export function getWorkspaceIdFromBody(body: Record<string, unknown>): string | null {
  const id = body.workspaceId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}
