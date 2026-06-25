import "server-only";

import { requireSessionUser, requireSessionUserId } from "@/lib/auth-api";
import { withDatabase } from "@/lib/api-errors";
import {
  listWorkspaces,
  createWorkspace,
  inviteWorkspaceMemberByEmail,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  type InviteMemberError,
  type InvitationActionError,
} from "@/lib/workspaces";

const INVITE_STATUS: Record<InviteMemberError, number> = {
  not_found: 404,
  forbidden: 403,
  already_member: 409,
  is_owner: 400,
  already_invited: 409,
  invalid_email: 400,
};

const INVITE_MESSAGE: Record<InviteMemberError, string> = {
  not_found: "Workspace not found",
  forbidden: "Only the workspace owner can invite members",
  already_member: "That user is already a member",
  is_owner: "Cannot invite the workspace owner",
  already_invited: "An invitation is already pending for that email",
  invalid_email: "Enter a valid email address",
};

const ACTION_STATUS: Record<InvitationActionError, number> = {
  not_found: 404,
  forbidden: 403,
  not_pending: 400,
  email_mismatch: 403,
};

const ACTION_MESSAGE: Record<InvitationActionError, string> = {
  not_found: "Invitation not found",
  forbidden: "You cannot manage this invitation",
  not_pending: "This invitation is no longer pending",
  email_mismatch: "This invitation was sent to a different email address",
};

export async function GET() {
  const user = await requireSessionUser();
  if (user instanceof Response) return user;

  const result = await withDatabase(() => listWorkspaces(user.id, user.email));
  if (result instanceof Response) return result;
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "invite-member") {
    const userId = await requireSessionUserId();
    if (userId instanceof Response) return userId;

    if (!body.workspaceId || !body.email) {
      return Response.json({ detail: "workspaceId and email required" }, { status: 400 });
    }

    const result = await withDatabase(() =>
      inviteWorkspaceMemberByEmail(body.workspaceId, userId, body.email)
    );
    if (result instanceof Response) return result;
    if (!result.ok) {
      return Response.json(
        { detail: INVITE_MESSAGE[result.error] },
        { status: INVITE_STATUS[result.error] }
      );
    }
    return Response.json({ ok: true, invitation: result.invitation });
  }

  if (body.action === "accept-invitation") {
    const user = await requireSessionUser();
    if (user instanceof Response) return user;
    if (!body.invitationId) {
      return Response.json({ detail: "invitationId required" }, { status: 400 });
    }

    const result = await withDatabase(() =>
      acceptInvitation(body.invitationId, user.id, user.email)
    );
    if (result instanceof Response) return result;
    if (!result.ok) {
      return Response.json(
        { detail: ACTION_MESSAGE[result.error] },
        { status: ACTION_STATUS[result.error] }
      );
    }
    return Response.json({ ok: true, workspace: result.workspace });
  }

  if (body.action === "decline-invitation") {
    const user = await requireSessionUser();
    if (user instanceof Response) return user;
    if (!body.invitationId) {
      return Response.json({ detail: "invitationId required" }, { status: 400 });
    }

    const result = await withDatabase(() => declineInvitation(body.invitationId, user.email));
    if (result instanceof Response) return result;
    if (!result.ok) {
      return Response.json(
        { detail: ACTION_MESSAGE[result.error] },
        { status: ACTION_STATUS[result.error] }
      );
    }
    return Response.json({ ok: true });
  }

  if (body.action === "cancel-invitation") {
    const userId = await requireSessionUserId();
    if (userId instanceof Response) return userId;
    if (!body.invitationId) {
      return Response.json({ detail: "invitationId required" }, { status: 400 });
    }

    const result = await withDatabase(() => cancelInvitation(body.invitationId, userId));
    if (result instanceof Response) return result;
    if (!result.ok) {
      return Response.json(
        { detail: ACTION_MESSAGE[result.error] },
        { status: ACTION_STATUS[result.error] }
      );
    }
    return Response.json({ ok: true });
  }

  const userId = await requireSessionUserId();
  if (userId instanceof Response) return userId;

  if (!body.name) {
    return Response.json({ detail: "name required" }, { status: 400 });
  }

  const ws = await withDatabase(() => createWorkspace(body.name, userId));
  if (ws instanceof Response) return ws;
  return Response.json(ws);
}
