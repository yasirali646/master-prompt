import { getSessionUserId, requireDataScope } from "@/lib/auth-api";
import { BUILTIN_TEMPLATES, deleteTemplate, listTemplates, saveTemplate } from "@/lib/templates";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json(BUILTIN_TEMPLATES);

  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;
  return Response.json(await listTemplates(scope));
}

export async function POST(request: Request) {
  const body = await request.json();
  const scope = await requireDataScope(request, body);
  if (scope instanceof Response) return scope;

  if (!body.label || !body.idea) {
    return Response.json({ detail: "label and idea required" }, { status: 400 });
  }
  const t = await saveTemplate(scope, body.label, body.idea);
  return Response.json(t);
}

export async function DELETE(request: Request) {
  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ detail: "id required" }, { status: 400 });
  const ok = await deleteTemplate(scope, id);
  if (!ok) return Response.json({ detail: "Not found" }, { status: 400 });
  return Response.json({ ok: true });
}
