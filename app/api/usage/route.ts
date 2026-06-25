import { requireDataScope } from "@/lib/auth-api";
import { getUsageSummary } from "@/lib/usage-store";

export async function GET(request: Request) {
  const scope = await requireDataScope(request);
  if (scope instanceof Response) return scope;
  return Response.json(await getUsageSummary(scope));
}
