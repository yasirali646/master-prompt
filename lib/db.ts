import "server-only";

import { readFileSync } from "fs";
import path from "path";
import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import { getDbConnectionInfo } from "./db-config";

type QueryParam = string | number | boolean | null | Date | Buffer;

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

const COLUMN_MIGRATIONS: { table: string; column: string; ddl: string }[] = [
  {
    table: "history",
    column: "workspace_id",
    ddl: "ALTER TABLE history ADD COLUMN workspace_id CHAR(36) NULL",
  },
  {
    table: "user_templates",
    column: "workspace_id",
    ddl: "ALTER TABLE user_templates ADD COLUMN workspace_id CHAR(36) NULL",
  },
  {
    table: "usage_records",
    column: "workspace_id",
    ddl: "ALTER TABLE usage_records ADD COLUMN workspace_id CHAR(36) NULL",
  },
];

const INDEX_MIGRATIONS: { name: string; ddl: string }[] = [
  {
    name: "idx_history_workspace_created",
    ddl: "CREATE INDEX idx_history_workspace_created ON history (workspace_id, created_at)",
  },
  {
    name: "idx_templates_workspace",
    ddl: "CREATE INDEX idx_templates_workspace ON user_templates (workspace_id)",
  },
  {
    name: "idx_usage_workspace_created",
    ddl: "CREATE INDEX idx_usage_workspace_created ON usage_records (workspace_id, created_at)",
  },
];

export function getDatabaseUrl(): string {
  const { host, port, user, database } = getDbConnectionInfo();
  return `mysql://${user}@${host}:${port}/${database}`;
}

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(getDbConnectionInfo().pool);
  }
  return pool;
}

/** Lightweight connectivity check — no schema migrations. */
export async function pingDatabase(): Promise<void> {
  await getPool().execute("SELECT 1 AS ok");
}

async function poolQuery<T extends RowDataPacket>(
  sql: string,
  params: QueryParam[] = []
): Promise<T[]> {
  const [rows] = await getPool().execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await poolQuery<RowDataPacket & { cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return (rows[0]?.cnt ?? 0) > 0;
}

async function indexExists(name: string): Promise<boolean> {
  const rows = await poolQuery<RowDataPacket & { cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = ?`,
    [name]
  );
  return (rows[0]?.cnt ?? 0) > 0;
}

async function runMigrations(): Promise<void> {
  for (const migration of COLUMN_MIGRATIONS) {
    if (!(await columnExists(migration.table, migration.column))) {
      await getPool().execute(migration.ddl);
    }
  }
  for (const migration of INDEX_MIGRATIONS) {
    if (!(await indexExists(migration.name))) {
      try {
        await getPool().execute(migration.ddl);
      } catch (error) {
        console.error(`Index migration ${migration.name} failed:`, error);
      }
    }
  }
}

async function ensureSchema(): Promise<void> {
  const sql = readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf-8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const connection = await getPool().getConnection();
  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    await runMigrations();
  } finally {
    connection.release();
  }
}

export async function initDb(): Promise<void> {
  if (!schemaReady) {
    schemaReady = ensureSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function query<T extends RowDataPacket>(
  sql: string,
  params: QueryParam[] = []
): Promise<T[]> {
  await initDb();
  return poolQuery<T>(sql, params);
}

export async function execute(
  sql: string,
  params: QueryParam[] = []
): Promise<ResultSetHeader> {
  await initDb();
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}
