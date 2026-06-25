const STORAGE_KEY = "mp_active_workspace";

export function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveWorkspaceId(id: string | null): void {
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
}

export function workspaceQuery(workspaceId: string | null): string {
  return workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
}

export function withWorkspaceId(
  body: Record<string, unknown>,
  workspaceId: string | null
): Record<string, unknown> {
  if (!workspaceId) return body;
  return { ...body, workspaceId };
}
