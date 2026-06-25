import "server-only";

import { isWorkspaceMember } from "./workspace-access";

export interface PersonalScope {
  kind: "personal";
  userId: string;
}

export interface WorkspaceScope {
  kind: "workspace";
  userId: string;
  workspaceId: string;
}

export type DataScope = PersonalScope | WorkspaceScope;

export async function resolveDataScope(
  userId: string,
  workspaceId: string | null | undefined
): Promise<DataScope | "forbidden"> {
  if (!workspaceId) return { kind: "personal", userId };
  const allowed = await isWorkspaceMember(userId, workspaceId);
  if (!allowed) return "forbidden";
  return { kind: "workspace", userId, workspaceId };
}
