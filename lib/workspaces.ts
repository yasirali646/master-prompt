import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { execute, query } from "./db";
import { findUserByEmail } from "./users";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  pendingInvites?: WorkspaceInvite[];
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  inviterId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface WorkspacesPayload {
  workspaces: Workspace[];
  pendingInvitations: WorkspaceInvite[];
}

export type InviteMemberError =
  | "not_found"
  | "forbidden"
  | "already_member"
  | "is_owner"
  | "already_invited"
  | "invalid_email";

export type InvitationActionError =
  | "not_found"
  | "forbidden"
  | "not_pending"
  | "email_mismatch";

interface WorkspaceRow extends RowDataPacket {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
}

interface InviteRow extends RowDataPacket {
  id: string;
  workspace_id: string;
  email: string;
  inviter_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: Date;
  workspace_name?: string;
}

async function loadMemberIds(workspaceId: string): Promise<string[]> {
  const rows = await query<RowDataPacket & { user_id: string }>(
    "SELECT user_id FROM workspace_members WHERE workspace_id = ?",
    [workspaceId]
  );
  return rows.map((row) => row.user_id);
}

async function loadPendingInvitesForWorkspace(workspaceId: string): Promise<WorkspaceInvite[]> {
  const rows = await query<InviteRow>(
    `SELECT i.id, i.workspace_id, i.email, i.inviter_id, i.status, i.created_at
     FROM workspace_invitations i
     WHERE i.workspace_id = ? AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    [workspaceId]
  );
  return rows.map(mapInvite);
}

function mapInvite(row: InviteRow): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name ?? "",
    email: row.email,
    inviterId: row.inviter_id,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapWorkspace(row: WorkspaceRow, memberIds: string[], pendingInvites?: WorkspaceInvite[]): Workspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    memberIds,
    createdAt: new Date(row.created_at).toISOString(),
    pendingInvites,
  };
}

export async function listWorkspaces(userId: string, userEmail: string): Promise<WorkspacesPayload> {
  const rows = await query<WorkspaceRow>(
    `SELECT DISTINCT w.id, w.name, w.owner_id, w.created_at
     FROM workspaces w
     LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE w.owner_id = ? OR wm.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId, userId]
  );

  const workspaces: Workspace[] = [];
  for (const row of rows) {
    const pendingInvites = row.owner_id === userId ? await loadPendingInvitesForWorkspace(row.id) : undefined;
    workspaces.push(mapWorkspace(row, await loadMemberIds(row.id), pendingInvites));
  }

  const pendingInvitations = await listPendingInvitationsForEmail(userEmail);
  return { workspaces, pendingInvitations };
}

export async function listPendingInvitationsForEmail(email: string): Promise<WorkspaceInvite[]> {
  const rows = await query<InviteRow>(
    `SELECT i.id, i.workspace_id, i.email, i.inviter_id, i.status, i.created_at, w.name AS workspace_name
     FROM workspace_invitations i
     JOIN workspaces w ON w.id = i.workspace_id
     WHERE LOWER(i.email) = LOWER(?) AND i.status = 'pending'
     ORDER BY i.created_at DESC`,
    [email.trim()]
  );
  return rows.map(mapInvite);
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const rows = await query<WorkspaceRow>(
    "SELECT id, name, owner_id, created_at FROM workspaces WHERE id = ? LIMIT 1",
    [workspaceId]
  );
  if (!rows[0]) return null;
  return mapWorkspace(rows[0], await loadMemberIds(workspaceId));
}

export async function createWorkspace(name: string, ownerId: string): Promise<Workspace> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await execute(
    "INSERT INTO workspaces (id, name, owner_id, created_at) VALUES (?, ?, ?, ?)",
    [id, name, ownerId, createdAt]
  );
  return { id, name, ownerId, memberIds: [], createdAt };
}

export async function inviteWorkspaceMemberByEmail(
  workspaceId: string,
  requesterId: string,
  email: string
): Promise<{ ok: true; invitation: WorkspaceInvite } | { ok: false; error: InviteMemberError }> {
  const ws = await getWorkspace(workspaceId);
  if (!ws) return { ok: false, error: "not_found" };
  if (ws.ownerId !== requesterId) return { ok: false, error: "forbidden" };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return { ok: false, error: "invalid_email" };

  const owner = await findUserByEmail(trimmed);
  if (owner?.id === ws.ownerId) return { ok: false, error: "is_owner" };
  if (owner && ws.memberIds.includes(owner.id)) return { ok: false, error: "already_member" };

  const existingInvite = await query<InviteRow>(
    `SELECT id FROM workspace_invitations
     WHERE workspace_id = ? AND LOWER(email) = ? AND status = 'pending' LIMIT 1`,
    [workspaceId, trimmed]
  );
  if (existingInvite[0]) return { ok: false, error: "already_invited" };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await execute(
    `INSERT INTO workspace_invitations (id, workspace_id, email, inviter_id, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [id, workspaceId, trimmed, requesterId, createdAt]
  );

  return {
    ok: true,
    invitation: {
      id,
      workspaceId,
      workspaceName: ws.name,
      email: trimmed,
      inviterId: requesterId,
      status: "pending",
      createdAt,
    },
  };
}

export async function acceptInvitation(
  invitationId: string,
  userId: string,
  userEmail: string
): Promise<{ ok: true; workspace: Workspace } | { ok: false; error: InvitationActionError }> {
  const rows = await query<InviteRow>(
    "SELECT id, workspace_id, email, inviter_id, status, created_at FROM workspace_invitations WHERE id = ? LIMIT 1",
    [invitationId]
  );
  const invite = rows[0];
  if (!invite) return { ok: false, error: "not_found" };
  if (invite.status !== "pending") return { ok: false, error: "not_pending" };
  if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
    return { ok: false, error: "email_mismatch" };
  }

  const ws = await getWorkspace(invite.workspace_id);
  if (!ws) return { ok: false, error: "not_found" };

  if (ws.ownerId !== userId && !ws.memberIds.includes(userId)) {
    await execute(
      "INSERT IGNORE INTO workspace_members (workspace_id, user_id) VALUES (?, ?)",
      [invite.workspace_id, userId]
    );
  }

  await execute(
    "UPDATE workspace_invitations SET status = 'accepted' WHERE id = ?",
    [invitationId]
  );

  return { ok: true, workspace: (await getWorkspace(invite.workspace_id))! };
}

export async function declineInvitation(
  invitationId: string,
  userEmail: string
): Promise<{ ok: true } | { ok: false; error: InvitationActionError }> {
  const rows = await query<InviteRow>(
    "SELECT id, email, status FROM workspace_invitations WHERE id = ? LIMIT 1",
    [invitationId]
  );
  const invite = rows[0];
  if (!invite) return { ok: false, error: "not_found" };
  if (invite.status !== "pending") return { ok: false, error: "not_pending" };
  if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
    return { ok: false, error: "email_mismatch" };
  }

  await execute(
    "UPDATE workspace_invitations SET status = 'declined' WHERE id = ?",
    [invitationId]
  );
  return { ok: true };
}

export async function cancelInvitation(
  invitationId: string,
  requesterId: string
): Promise<{ ok: true } | { ok: false; error: InvitationActionError }> {
  const rows = await query<InviteRow & { owner_id: string }>(
    `SELECT i.id, i.status, w.owner_id
     FROM workspace_invitations i
     JOIN workspaces w ON w.id = i.workspace_id
     WHERE i.id = ? LIMIT 1`,
    [invitationId]
  );
  const invite = rows[0];
  if (!invite) return { ok: false, error: "not_found" };
  if (invite.owner_id !== requesterId) return { ok: false, error: "forbidden" };
  if (invite.status !== "pending") return { ok: false, error: "not_pending" };

  await execute("DELETE FROM workspace_invitations WHERE id = ?", [invitationId]);
  return { ok: true };
}
