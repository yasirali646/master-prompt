import "server-only";

import { auth } from "@/auth";
import { resolveDataScope, type DataScope } from "./data-scope";
import { getWorkspaceIdFromBody, getWorkspaceIdFromRequest } from "./workspace-access";

export async function resolveScopeForUser(
  userId: string,
  body?: Record<string, unknown>
): Promise<DataScope | "forbidden"> {
  const workspaceId = body ? getWorkspaceIdFromBody(body) : null;
  return resolveDataScope(userId, workspaceId);
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getSessionUserEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

export async function requireSessionUserId(): Promise<string | Response> {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ detail: "Sign in required" }, { status: 401 });
  }
  return userId;
}

export async function requireSessionUser(): Promise<
  { id: string; email: string } | Response
> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ detail: "Sign in required" }, { status: 401 });
  }
  return { id: session.user.id, email: session.user.email };
}

export async function requireDataScope(
  request: Request,
  body?: Record<string, unknown>
): Promise<DataScope | Response> {
  const userId = await requireSessionUserId();
  if (userId instanceof Response) return userId;

  const workspaceId = body
    ? getWorkspaceIdFromBody(body) ?? getWorkspaceIdFromRequest(request)
    : getWorkspaceIdFromRequest(request);

  const scope = await resolveDataScope(userId, workspaceId);
  if (scope === "forbidden") {
    return Response.json({ detail: "Workspace access denied" }, { status: 403 });
  }
  return scope;
}
