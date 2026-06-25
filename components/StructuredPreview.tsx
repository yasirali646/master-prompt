"use client";

import { parseSections } from "@/lib/parse-sections";
import { useState } from "react";

export function StructuredPreview({ text }: { text: string }) {
  const sections = parseSections(text);
  const [open, setOpen] = useState<Set<string>>(new Set([sections[0]?.id]));

  if (!text) return null;

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav className="border-b border-border px-4 py-3 md:px-6" aria-label="Section navigation">
      <div className="mb-3 flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              toggle(s.id);
              document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth" });
            }}
            className="cursor-pointer rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-fg transition-colors hover:text-foreground"
          >
            {s.title.length > 30 ? s.title.slice(0, 30) + "…" : s.title}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <details key={s.id} id={`section-${s.id}`} open={open.has(s.id)}>
            <summary
              className="cursor-pointer text-sm font-medium text-foreground"
              onClick={(e) => { e.preventDefault(); toggle(s.id); }}
            >
              {s.title}
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-[10px] bg-background p-3 font-mono text-xs leading-relaxed text-muted-fg">
              {s.content || "(empty)"}
            </pre>
          </details>
        ))}
      </div>
    </nav>
  );
}
