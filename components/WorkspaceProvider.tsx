"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  workspaceQuery,
  withWorkspaceId,
} from "@/lib/workspace-api";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  pendingInvites?: {
    id: string;
    email: string;
    createdAt: string;
  }[];
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

interface WorkspaceContextValue {
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  pendingInvitations: WorkspaceInvitation[];
  loading: boolean;
  setActiveWorkspace: (id: string | null) => void;
  refreshWorkspaces: () => Promise<void>;
  apiQuery: () => string;
  withWorkspace: (body: Record<string, unknown>) => Record<string, unknown>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const [activeWorkspaceId, setActiveId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWorkspaces = useCallback(async () => {
    if (!isLoggedIn) {
      setWorkspaces([]);
      setPendingInvitations([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) return;
      const data = await res.json();
      setWorkspaces(data.workspaces ?? []);
      setPendingInvitations(data.pendingInvitations ?? []);

      const stored = getActiveWorkspaceId();
      const ids = new Set((data.workspaces ?? []).map((w: Workspace) => w.id));
      if (stored && ids.has(stored)) {
        setActiveId(stored);
      } else if (stored && !ids.has(stored)) {
        setActiveWorkspaceId(null);
        setActiveId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) {
      setActiveId(null);
      setWorkspaces([]);
      setPendingInvitations([]);
      return;
    }
    setActiveId(getActiveWorkspaceId());
    void refreshWorkspaces();
  }, [isLoggedIn, status, refreshWorkspaces]);

  const setActiveWorkspace = useCallback((id: string | null) => {
    setActiveWorkspaceId(id);
    setActiveId(id);
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );

  const apiQuery = useCallback(() => workspaceQuery(activeWorkspaceId), [activeWorkspaceId]);

  const withWorkspace = useCallback(
    (body: Record<string, unknown>) => withWorkspaceId(body, activeWorkspaceId),
    [activeWorkspaceId]
  );

  const value = useMemo(
    () => ({
      activeWorkspaceId,
      activeWorkspace,
      workspaces,
      pendingInvitations,
      loading,
      setActiveWorkspace,
      refreshWorkspaces,
      apiQuery,
      withWorkspace,
    }),
    [
      activeWorkspaceId,
      activeWorkspace,
      workspaces,
      pendingInvitations,
      loading,
      setActiveWorkspace,
      refreshWorkspaces,
      apiQuery,
      withWorkspace,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    return {
      activeWorkspaceId: null,
      activeWorkspace: null,
      workspaces: [],
      pendingInvitations: [],
      loading: false,
      setActiveWorkspace: () => {},
      refreshWorkspaces: async () => {},
      apiQuery: () => "",
      withWorkspace: (body) => body,
    };
  }
  return ctx;
}
