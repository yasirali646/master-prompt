import { requireDataScope } from "@/lib/auth-api";
import { deleteHistoryEntry, getHistoryEntry, appendVersion } from "@/lib/history-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;

  const { id } = await params;
  const entry = await getHistoryEntry(scope, id);
  if (!entry) return Response.json({ detail: "Not found" }, { status: 404 });
  return Response.json(entry);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;

  const { id } = await params;
  const ok = await deleteHistoryEntry(scope, id);
  if (!ok) return Response.json({ detail: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  const scope = await requireDataScope(request, body);
  if (scope instanceof Response) return scope;

  const { id } = await params;
  const entry = await appendVersion(scope, id, body.output, body.instruction);
  if (!entry) return Response.json({ detail: "Not found" }, { status: 404 });
  return Response.json(entry);
}
