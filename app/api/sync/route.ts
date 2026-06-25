import { requireSessionUserId } from "@/lib/auth-api";
import type { LocalDataExport } from "@/lib/client-data";
import { syncLocalDataToUser } from "@/lib/sync-local-data";

export async function POST(request: Request) {
  const userId = await requireSessionUserId();
  if (userId instanceof Response) return userId;

  const body = (await request.json()) as LocalDataExport;
  if (!body.hasData) {
    return Response.json({ ok: true, synced: false });
  }

  await syncLocalDataToUser(userId, body);
  return Response.json({ ok: true, synced: true });
}
