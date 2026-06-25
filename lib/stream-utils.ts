import type { ApiKeysPayload, Provider } from "./config-types";
import { validateOutput } from "./validation";

export interface StreamOptions {
  provider?: Provider | null;
  model?: string | null;
  temperature?: number;
  maxTokens?: number;
  apiKeys?: ApiKeysPayload | null;
}

export interface StreamEvent {
  type: "chunk" | "done" | "error";
  content?: string;
  missing?: string[];
  message?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

export function createSseStream(
  textStream: AsyncIterable<string>,
  onComplete?: (fullText: string) => Promise<StreamEvent["usage"]>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        for await (const chunk of textStream) {
          fullText += chunk;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`
            )
          );
        }
        const missing = validateOutput(fullText);
        const usage = onComplete ? await onComplete(fullText) : undefined;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", missing, usage })}\n\n`
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });
}

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
} as const;
