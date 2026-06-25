"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useStream } from "@/hooks/useStream";
import { loadApiKeys } from "@/lib/client-api-keys";
import { recordLocalUsage } from "@/lib/client-data";
import { useWorkspace } from "./WorkspaceProvider";
import { Play } from "lucide-react";

interface TestSandboxProps {
  masterPrompt: string;
  provider: string;
  model: string;
}

export function TestSandbox({ masterPrompt, provider, model }: TestSandboxProps) {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;
  const { withWorkspace } = useWorkspace();
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState("");
  const { streaming, consumeStream, stop } = useStream();

  async function handleTest() {
    if (!masterPrompt) return;
    setResponse("");
    const result = await consumeStream(
      "/api/test-prompt",
      withWorkspace({
        masterPrompt,
        userMessage: userMessage || "Hello",
        provider,
        model,
        apiKeys: await loadApiKeys(),
      }),
      setResponse
    );
    if (!isLoggedIn) {
      recordLocalUsage({
        type: "test",
        provider,
        model,
        totalTokens: result.usage?.totalTokens,
      });
    }
  }

  if (!masterPrompt) return null;

  return (
    <div className="border-t border-border px-4 py-4 md:px-6">
      <h3 className="mb-3 text-sm font-semibold">Test prompt (preview STATE 1)</h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Simulated user message (optional)"
          className="field-input flex-1"
          disabled={streaming}
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleTest} disabled={streaming} className="btn-secondary cursor-pointer shrink-0">
            <Play className="h-4 w-4" /> Test
          </button>
          {streaming && (
            <button type="button" onClick={stop} className="btn-secondary cursor-pointer">Stop</button>
          )}
        </div>
      </div>
      {response && (
        <pre className="mt-3 whitespace-pre-wrap rounded-[10px] border border-border bg-background p-3 font-mono text-sm">{response}</pre>
      )}
    </div>
  );
}
