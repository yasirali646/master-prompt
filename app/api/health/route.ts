import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db-config";
import { pingDatabase } from "@/lib/db";

export async function GET() {
  const checks: Record<string, string> = {
    auth_secret: process.env.AUTH_SECRET ? "ok" : "missing",
    auth_url: process.env.AUTH_URL ?? "missing",
    database_config: isDatabaseConfigured() ? "set" : "missing",
    google_client_id: process.env.GOOGLE_CLIENT_ID ? "set" : "missing",
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? "set" : "missing",
  };

  let database: "ok" | "error" = "error";

  if (isDatabaseConfigured()) {
    try {
      await pingDatabase();
      database = "ok";
    } catch {
      database = "error";
    }
  }

  const healthy =
    checks.auth_secret === "ok" &&
    checks.database_config === "set" &&
    database === "ok" &&
    checks.google_client_id === "set" &&
    checks.google_client_secret === "set";

  return NextResponse.json(
    {
      healthy,
      checks,
      database,
    },
    { status: healthy ? 200 : 503 }
  );
}
