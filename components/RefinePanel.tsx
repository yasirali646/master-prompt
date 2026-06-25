"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useStream } from "@/hooks/useStream";
import { loadApiKeys } from "@/lib/client-api-keys";
import { recordLocalUsage } from "@/lib/client-data";
import { useWorkspace } from "./WorkspaceProvider";
import { Wand2 } from "lucide-react";

interface RefinePanelProps {
  idea: string;
  output: string;
  provider: string;
  model: string;
  onRefined: (text: string, instruction: string) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function RefinePanel({ idea, output, provider, model, onRefined, onToast }: RefinePanelProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const { withWorkspace } = useWorkspace();
  const [instruction, setInstruction] = useState("");
  const [preview, setPreview] = useState("");
  const { streaming, consumeStream, stop } = useStream();

  async function handleRefine(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim() || !output) return;
    setPreview("");
    try {
      const result = await consumeStream(
        "/api/refine",
        withWorkspace({
          idea,
          currentOutput: output,
          instruction,
          provider,
          model,
          apiKeys: await loadApiKeys(),
        }),
        setPreview
      );
      onRefined(result.text, instruction);
      if (!isLoggedIn) {
        recordLocalUsage({
          type: "refine",
          provider,
          model,
          totalTokens: result.usage?.totalTokens,
        });
      }
      setInstruction("");
      onToast("Refinement applied");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Refine failed", "error");
    }
  }

  if (!output) return null;

  return (
    <div className="border-t border-border px-4 py-4 md:px-6">
      <h3 className="mb-3 text-sm font-semibold">Refine prompt</h3>
      <form onSubmit={handleRefine} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Add an export-to-Notion state"'
          disabled={streaming}
          className="field-input flex-1"
          aria-label="Refinement instruction"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={streaming || !instruction.trim()} className="btn-primary cursor-pointer !w-auto shrink-0 px-5">
            <Wand2 className="h-4 w-4" /> Refine
          </button>
          {streaming && (
            <button type="button" onClick={stop} className="btn-secondary cursor-pointer">
              Stop
            </button>
          )}
        </div>
      </form>
      {streaming && preview && (
        <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-[10px] bg-background p-3 font-mono text-xs">{preview}</pre>
      )}
    </div>
  );
}
