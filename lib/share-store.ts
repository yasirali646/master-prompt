import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { execute, query } from "./db";

export interface SharedPrompt {
  id: string;
  idea: string;
  output: string;
  createdAt: string;
  expiresAt?: string;
}

interface ShareRow extends RowDataPacket {
  id: string;
  idea: string;
  output: string;
  created_at: Date;
  expires_at: Date | null;
}

function mapShare(row: ShareRow): SharedPrompt {
  return {
    id: row.id,
    idea: row.idea,
    output: row.output,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
  };
}

export async function createShare(
  idea: string,
  output: string,
  userId?: string | null
): Promise<SharedPrompt> {
  const id = crypto.randomUUID().slice(0, 8);
  const createdAt = new Date().toISOString();
  await execute(
    "INSERT INTO shares (id, user_id, idea, output, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, userId ?? null, idea, output, createdAt]
  );
  return { id, idea, output, createdAt };
}

export async function getShare(id: string): Promise<SharedPrompt | null> {
  const rows = await query<ShareRow>(
    "SELECT id, idea, output, created_at, expires_at FROM shares WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows[0]) return null;
  const share = mapShare(rows[0]);
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return null;
  return share;
}
