import "server-only";

import type { PoolOptions } from "mysql2/promise";

export type DbConfigSource = "DATABASE_URL" | "MYSQL_ENV";

export interface DbConnectionInfo {
  source: DbConfigSource;
  host: string;
  port: number;
  user: string;
  database: string;
  pool: PoolOptions;
}

function hasSplitMysqlEnv(): boolean {
  return Boolean(
    process.env.MYSQL_HOST &&
      process.env.MYSQL_USER &&
      process.env.MYSQL_PASSWORD &&
      process.env.MYSQL_DATABASE
  );
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) || hasSplitMysqlEnv();
}

export function getDbConnectionInfo(): DbConnectionInfo {
  if (hasSplitMysqlEnv()) {
    const host = process.env.MYSQL_HOST!.trim();
    const user = process.env.MYSQL_USER!.trim();
    const password = process.env.MYSQL_PASSWORD!;
    const database = process.env.MYSQL_DATABASE!.trim();
    const port = Number(process.env.MYSQL_PORT || "3306");

    return {
      source: "MYSQL_ENV",
      host,
      port,
      user,
      database,
      pool: {
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
      },
    };
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL is invalid. Use mysql://user:password@host:3306/database");
  }

  if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error("DATABASE_URL must include host and database name.");
  }

  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.replace(/^\//, "");
  const port = parsed.port ? Number(parsed.port) : 3306;

  return {
    source: "DATABASE_URL",
    host: parsed.hostname,
    port,
    user,
    database,
    pool: {
      host: parsed.hostname,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
    },
  };
}
