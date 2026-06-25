import "server-only";

function databaseErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Database error";
  console.error("[workspaces]", message);

  if (message.includes("Access denied") || message.includes("ECONNREFUSED")) {
    return Response.json(
      {
        detail:
          "Database connection failed. Check DATABASE_URL and allow remote MySQL access for your host (e.g. Hostinger Remote MySQL).",
      },
      { status: 503 }
    );
  }

  if (message.includes("doesn't exist")) {
    return Response.json(
      { detail: "Database schema is not ready. Redeploy or run migrations." },
      { status: 503 }
    );
  }

  return Response.json({ detail: "Server error" }, { status: 500 });
}

export async function withDatabase<T>(handler: () => Promise<T>): Promise<T | Response> {
  try {
    return await handler();
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
