import { getSessionUserId } from "@/lib/auth-api";
import { createShare, getShare } from "@/lib/share-store";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ detail: "id required" }, { status: 400 });
  const share = await getShare(id);
  if (!share) return Response.json({ detail: "Not found" }, { status: 404 });
  return Response.json(share);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.idea || !body.output) {
    return Response.json({ detail: "idea and output required" }, { status: 400 });
  }
  const userId = await getSessionUserId();
  const share = await createShare(body.idea, body.output, userId);
  return Response.json(share);
}
