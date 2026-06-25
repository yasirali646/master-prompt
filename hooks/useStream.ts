"use client";

import { useCallback, useRef, useState } from "react";

export interface StreamResult {
  text: string;
  missing: string[];
  usage?: { totalTokens?: number };
}

export function useStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const consumeStream = useCallback(
    async (
      url: string,
      body: Record<string, unknown>,
      onChunk: (text: string) => void
    ): Promise<StreamResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      let fullText = "";
      let missing: string[] = [];
      let usage: StreamResult["usage"];

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6));
            if (data.type === "chunk") {
              fullText += data.content;
              onChunk(fullText);
            } else if (data.type === "done") {
              missing = data.missing ?? [];
              usage = data.usage;
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          }
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }

      return { text: fullText, missing, usage };
    },
    []
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { streaming, consumeStream, stop };
}
