"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useWorkspace } from "@/components/WorkspaceProvider";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  pendingInvites?: { id: string; email: string; createdAt: string }[];
}

export default function WorkspacesPage() {
  const { data: session } = useSession();
  const {
    workspaces,
    pendingInvitations,
    loading,
    refreshWorkspaces,
    setActiveWorkspace,
  } = useWorkspace();
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [inviteError, setInviteError] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) void refreshWorkspaces();
  }, [userId, refreshWorkspaces]);

  async function createWs(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    setName("");
    await refreshWorkspaces();
  }

  async function inviteMember(workspaceId: string, e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail[workspaceId]?.trim();
    if (!email) return;

    setInviteError((prev) => ({ ...prev, [workspaceId]: "" }));

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite-member", workspaceId, email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setInviteError((prev) => ({
        ...prev,
        [workspaceId]: data.detail ?? "Could not send invitation",
      }));
      return;
    }

    setInviteEmail((prev) => ({ ...prev, [workspaceId]: "" }));
    await refreshWorkspaces();
  }

  async function acceptInvite(invitationId: string) {
    setActionError("");
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept-invitation", invitationId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.detail ?? "Could not accept invitation");
      return;
    }
    const data = await res.json();
    await refreshWorkspaces();
    if (data.workspace?.id) setActiveWorkspace(data.workspace.id);
  }

  async function declineInvite(invitationId: string) {
    setActionError("");
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline-invitation", invitationId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.detail ?? "Could not decline invitation");
      return;
    }
    await refreshWorkspaces();
  }

  async function cancelInvite(invitationId: string) {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel-invitation", invitationId }),
    });
    if (res.ok) await refreshWorkspaces();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Workspaces</h1>
            <p className="text-sm text-muted-fg">
              Signed in as {session?.user?.email ?? session?.user?.name}
            </p>
            <p className="mt-1 text-xs text-muted-fg">
              Shared history, templates, settings, and usage when a workspace is active.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-secondary cursor-pointer text-sm"
          >
            Sign out
          </button>
        </div>

        {pendingInvitations.length > 0 && (
          <section className="mb-8 rounded-[12px] border border-accent/30 bg-accent-muted/40 p-4">
            <h2 className="mb-3 text-sm font-semibold text-accent">
              Pending invitations ({pendingInvitations.length})
            </h2>
            <ul className="space-y-2">
              {pendingInvitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-2 rounded-[10px] border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.workspaceName}</p>
                    <p className="text-xs text-muted-fg">
                      Invited to join this shared workspace
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => acceptInvite(inv.id)}
                      className="btn-primary cursor-pointer !w-auto !min-h-9 px-4 text-sm"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => declineInvite(inv.id)}
                      className="btn-secondary cursor-pointer !min-h-9 px-4 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {actionError && <p className="mt-2 text-xs text-destructive">{actionError}</p>}
          </section>
        )}

        <form onSubmit={createWs} className="mb-8 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New workspace name"
            className="field-input flex-1"
            required
          />
          <button type="submit" className="btn-primary cursor-pointer !w-auto px-6">
            Create
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-muted-fg">Loading workspaces…</p>
        ) : (
          <ul className="space-y-3">
            {workspaces.map((w: Workspace) => {
              const isOwner = userId === w.ownerId;
              const memberCount = w.memberIds.length + 1;

              return (
                <li
                  key={w.id}
                  className="rounded-[12px] border border-border bg-surface px-4 py-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-muted-fg">
                        {memberCount} member{memberCount === 1 ? "" : "s"}
                        {isOwner ? " · You are the owner" : " · Member"}
                      </p>
                    </div>
                    {isOwner && (
                      <span className="shrink-0 rounded-full bg-accent-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                        Owner
                      </span>
                    )}
                  </div>

                  {isOwner && w.pendingInvites && w.pendingInvites.length > 0 && (
                    <div className="mb-3 rounded-[8px] border border-border bg-background px-3 py-2">
                      <p className="mb-2 text-xs font-medium text-muted-fg">Pending invites</p>
                      <ul className="space-y-1">
                        {w.pendingInvites.map((inv) => (
                          <li
                            key={inv.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span>{inv.email}</span>
                            <button
                              type="button"
                              onClick={() => cancelInvite(inv.id)}
                              className="cursor-pointer text-destructive hover:underline"
                            >
                              Cancel
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isOwner && (
                    <form
                      onSubmit={(e) => inviteMember(w.id, e)}
                      className="mt-3 border-t border-border pt-3"
                    >
                      <p className="mb-2 text-xs text-muted-fg">
                        Invite by email. They will see an invitation and must accept before joining.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmail[w.id] ?? ""}
                          onChange={(e) =>
                            setInviteEmail((prev) => ({ ...prev, [w.id]: e.target.value }))
                          }
                          placeholder="user@example.com"
                          className="field-input flex-1 !min-h-10 !py-2 text-sm"
                          required
                        />
                        <button
                          type="submit"
                          className="btn-secondary cursor-pointer shrink-0 !min-h-10 px-4 text-sm"
                        >
                          Invite
                        </button>
                      </div>
                      {inviteError[w.id] && (
                        <p className="mt-2 text-xs text-destructive">{inviteError[w.id]}</p>
                      )}
                    </form>
                  )}
                </li>
              );
            })}
            {workspaces.length === 0 && (
              <p className="text-sm text-muted-fg">No workspaces yet. Create one above.</p>
            )}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
