import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { execute, query } from "./db";
import type { DataScope } from "./data-scope";

export interface Template {
  id: string;
  label: string;
  idea: string;
  userCreated?: boolean;
}

export const BUILTIN_TEMPLATES: Template[] = [
  { id: "youtube", label: "YouTube clone", idea: "I want to create a youtube channel clone prompt" },
  { id: "onboarding", label: "Customer onboarding", idea: "Customer onboarding chatbot for a SaaS product" },
  { id: "legal", label: "Legal reviewer", idea: "Legal contract reviewer that analyzes clauses step by step" },
  { id: "podcast", label: "Podcast writer", idea: "Podcast script writer with interview-style state machine" },
  { id: "email", label: "Email sequences", idea: "Cold email sequence builder for B2B sales outreach" },
  { id: "support", label: "Support bot", idea: "Technical support bot for a developer tools company" },
  { id: "course", label: "Course creator", idea: "Online course content creator with lesson-by-lesson workflow" },
  { id: "research", label: "Research assistant", idea: "Academic research assistant with citation and synthesis states" },
];

interface TemplateRow extends RowDataPacket {
  id: string;
  label: string;
  idea: string;
}

export async function listUserTemplates(scope: DataScope): Promise<Template[]> {
  const rows =
    scope.kind === "workspace"
      ? await query<TemplateRow>(
          "SELECT id, label, idea FROM user_templates WHERE workspace_id = ? ORDER BY created_at ASC",
          [scope.workspaceId]
        )
      : await query<TemplateRow>(
          "SELECT id, label, idea FROM user_templates WHERE user_id = ? AND workspace_id IS NULL ORDER BY created_at ASC",
          [scope.userId]
        );
  return rows.map((row) => ({ ...row, userCreated: true }));
}

export async function listTemplates(scope: DataScope | null): Promise<Template[]> {
  if (!scope) return [...BUILTIN_TEMPLATES];
  const user = await listUserTemplates(scope);
  return [...BUILTIN_TEMPLATES, ...user];
}

export async function saveTemplate(scope: DataScope, label: string, idea: string): Promise<Template> {
  const t: Template = {
    id: crypto.randomUUID(),
    label,
    idea,
    userCreated: true,
  };
  const workspaceId = scope.kind === "workspace" ? scope.workspaceId : null;
  await execute(
    "INSERT INTO user_templates (id, user_id, workspace_id, label, idea) VALUES (?, ?, ?, ?, ?)",
    [t.id, scope.userId, workspaceId, label, idea]
  );
  return t;
}

export async function deleteTemplate(scope: DataScope, id: string): Promise<boolean> {
  const result =
    scope.kind === "workspace"
      ? await execute("DELETE FROM user_templates WHERE workspace_id = ? AND id = ?", [
          scope.workspaceId,
          id,
        ])
      : await execute(
          "DELETE FROM user_templates WHERE user_id = ? AND workspace_id IS NULL AND id = ?",
          [scope.userId, id]
        );
  return result.affectedRows > 0;
}
