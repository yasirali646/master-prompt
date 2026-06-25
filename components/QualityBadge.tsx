"use client";

import { analyzeQuality } from "@/lib/quality";
import { Check, X } from "lucide-react";

export function QualityBadge({ text }: { text: string }) {
  if (!text) return null;
  const { score, checks } = analyzeQuality(text);

  const color =
    score >= 80 ? "text-accent border-accent/30 bg-accent/10" :
    score >= 60 ? "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10" :
    "text-destructive border-destructive/30 bg-destructive/10";

  return (
    <details className="border-b border-border">
      <summary className={`cursor-pointer px-4 py-3 text-sm font-medium md:px-6 ${color} list-none flex items-center justify-between`}>
        <span>Quality score: {score}/100</span>
        <span className="text-xs opacity-70">Click to expand checklist</span>
      </summary>
      <ul className="space-y-2 px-4 pb-4 md:px-6">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm text-muted-fg">
            {c.passed ? (
              <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            ) : (
              <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </details>
  );
}
