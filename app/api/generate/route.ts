import "server-only";

import { getSessionUserId, resolveScopeForUser } from "@/lib/auth-api";
import { createStream } from "@/lib/generator";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loadRequestConfig } from "@/lib/request-config";
import { createSseStream, SSE_HEADERS } from "@/lib/stream-utils";
import { saveHistoryEntry } from "@/lib/history-store";
import { recordUsage } from "@/lib/usage-store";
import { parseProviderModel } from "@/lib/validate-request";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return Response.json({ detail: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const idea = (body.idea as string)?.trim();
  if (!idea || idea.length < 3) {
    return Response.json({ detail: "Idea must be at least 3 characters" }, { status: 400 });
  }

  const userId = await getSessionUserId();
  let scope = userId ? await resolveScopeForUser(userId, body) : null;
  if (scope === "forbidden") {
    return Response.json({ detail: "Workspace access denied" }, { status: 403 });
  }

  const config = await loadRequestConfig(userId, scope);

  try {
    const { provider, model } = parseProviderModel(body, config);

    const result = createStream(idea, config, {
      provider,
      model,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      apiKeys: body.apiKeys,
    });

    const stream = createSseStream(result.textStream, async (fullText) => {
      const usage = await result.usage;
      if (userId && scope) {
        await recordUsage(scope, {
          type: "generate",
          provider,
          model,
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          totalTokens: usage?.totalTokens,
        });
        if (!body.skipHistory) {
          await saveHistoryEntry(scope, { idea, output: fullText, provider, model });
        }
      }
      return {
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
      };
    });

    return new Response(stream, {
      headers: { ...SSE_HEADERS, "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return Response.json({ detail: message }, { status: 400 });
  }
}
