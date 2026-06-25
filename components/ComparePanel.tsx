"use client";

import { useState } from "react";
import { useStream } from "@/hooks/useStream";
import { loadApiKeys } from "@/lib/client-api-keys";
import { getDefaultModel } from "@/lib/providers";
import { useWorkspace } from "./WorkspaceProvider";
import { GitCompareArrows } from "lucide-react";

interface ComparePanelProps {
  idea: string;
  provider: string;
  model: string;
  onToast: (msg: string, type?: "success" | "error") => void;
}

export function ComparePanel({ idea, provider, model, onToast }: ComparePanelProps) {
  const { withWorkspace } = useWorkspace();
  const [openaiOut, setOpenaiOut] = useState("");
  const [anthropicOut, setAnthropicOut] = useState("");
  const [comparing, setComparing] = useState(false);
  const streamA = useStream();
  const streamB = useStream();

  async function handleCompare() {
    if (!idea.trim()) {
      onToast("Enter an idea first", "error");
      return;
    }
    setComparing(true);
    setOpenaiOut("");
    setAnthropicOut("");
    try {
      const apiKeys = await loadApiKeys();
      const openaiModel = provider === "openai" ? model : getDefaultModel("openai");
      const anthropicModel = provider === "anthropic" ? model : getDefaultModel("anthropic");
      await Promise.all([
        streamA.consumeStream(
          "/api/generate",
          withWorkspace({ idea, provider: "openai", model: openaiModel, skipHistory: true, apiKeys }),
          setOpenaiOut
        ),
        streamB.consumeStream(
          "/api/generate",
          withWorkspace({ idea, provider: "anthropic", model: anthropicModel, skipHistory: true, apiKeys }),
          setAnthropicOut
        ),
      ]);
      onToast("Comparison complete");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Compare failed", "error");
    } finally {
      setComparing(false);
    }
  }

  const busy = comparing || streamA.streaming || streamB.streaming;

  return (
    <section className="mt-8 rounded-[14px] border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Compare providers</h2>
        <button type="button" onClick={handleCompare} disabled={busy} className="btn-secondary cursor-pointer">
          <GitCompareArrows className="h-4 w-4" />
          {busy ? "Comparing…" : "Run A/B compare"}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">OpenAI</h3>
          <pre className="max-h-[40vh] min-h-[120px] overflow-y-auto whitespace-pre-wrap rounded-[10px] bg-background p-3 font-mono text-xs">
            {openaiOut || (busy ? "Generating…" : "—")}
          </pre>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-fg">Anthropic</h3>
          <pre className="max-h-[40vh] min-h-[120px] overflow-y-auto whitespace-pre-wrap rounded-[10px] bg-background p-3 font-mono text-xs">
            {anthropicOut || (busy ? "Generating…" : "—")}
          </pre>
        </div>
      </div>
    </section>
  );
}
