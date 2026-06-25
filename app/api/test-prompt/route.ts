import { getSessionUserId, resolveScopeForUser } from "@/lib/auth-api";
import { createTestStream } from "@/lib/generator";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loadRequestConfig } from "@/lib/request-config";
import { createSseStream, SSE_HEADERS } from "@/lib/stream-utils";
import { recordUsage } from "@/lib/usage-store";
import { parseProviderModel } from "@/lib/validate-request";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip).allowed) {
    return Response.json({ detail: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const masterPrompt = (body.masterPrompt as string)?.trim();
  if (!masterPrompt) {
    return Response.json({ detail: "masterPrompt required" }, { status: 400 });
  }

  const userId = await getSessionUserId();
  let scope = userId ? await resolveScopeForUser(userId, body) : null;
  if (scope === "forbidden") {
    return Response.json({ detail: "Workspace access denied" }, { status: 403 });
  }

  const config = await loadRequestConfig(userId, scope);
  try {
    const { provider, model } = parseProviderModel(body, config);
    const result = createTestStream(
      masterPrompt,
      body.userMessage || "Hello",
      config,
      { provider, model, apiKeys: body.apiKeys }
    );

    const stream = createSseStream(result.textStream, async () => {
      const usage = await result.usage;
      if (userId && scope) {
        await recordUsage(scope, {
          type: "test",
          provider,
          model,
          totalTokens: (await usage)?.totalTokens,
        });
      }
      return { totalTokens: (await usage)?.totalTokens };
    });

    return new Response(stream, { headers: SSE_HEADERS });
  } catch (err) {
    return Response.json(
      { detail: err instanceof Error ? err.message : "Test failed" },
      { status: 400 }
    );
  }
}
