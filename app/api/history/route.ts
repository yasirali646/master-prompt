import { requireDataScope } from "@/lib/auth-api";
import { listHistory, saveHistoryEntry } from "@/lib/history-store";

export async function GET(request: Request) {
  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;
  return Response.json(await listHistory(scope));
}

export async function POST(request: Request) {
  const body = await request.json();
  const scope = await requireDataScope(request, body);
  if (scope instanceof Response) return scope;

  const entry = await saveHistoryEntry(scope, {
    idea: body.idea,
    output: body.output,
    provider: body.provider ?? "anthropic",
    model: body.model ?? null,
    versions: body.versions,
  });
  return Response.json(entry);
}
