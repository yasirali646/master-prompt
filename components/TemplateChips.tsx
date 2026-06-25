"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { listLocalUserTemplates } from "@/lib/client-data";
import { useWorkspace } from "./WorkspaceProvider";

interface Template {
  id: string;
  label: string;
  idea: string;
}

export function TemplateChips({ onSelect }: { onSelect: (idea: string) => void }) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const { activeWorkspaceId, apiQuery } = useWorkspace();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    fetch(`/api/templates${apiQuery()}`)
      .then((r) => r.json())
      .then((builtin: Template[]) => {
        if (isLoggedIn) {
          setTemplates(builtin);
          return;
        }
        setTemplates([...builtin, ...listLocalUserTemplates()]);
      });
  }, [isLoggedIn, status, activeWorkspaceId, apiQuery]);

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.idea)}
          className="cursor-pointer rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-fg transition-colors hover:border-accent hover:text-accent"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
