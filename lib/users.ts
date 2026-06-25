import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { execute, query } from "./db";

export interface User {
  id: string;
  email: string;
  name: string;
  provider?: "google" | "github";
  image?: string;
}

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  provider: "google" | "github" | null;
  image: string | null;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    provider: row.provider ?? undefined,
    image: row.image ?? undefined,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await query<UserRow>(
    "SELECT id, email, name, provider, image FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [email]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const rows = await query<UserRow>(
    "SELECT id, email, name, provider, image FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findOrCreateOAuthUser(
  email: string,
  name: string,
  provider: "google" | "github",
  image?: string | null
): Promise<User> {
  const existing = await findUserByEmail(email);
  if (existing) {
    if (image && existing.image !== image) {
      await execute(
        "UPDATE users SET image = ?, name = ? WHERE id = ?",
        [image, name || existing.name, existing.id]
      );
      return { ...existing, image, name: name || existing.name };
    }
    return existing;
  }

  const id = crypto.randomUUID();
  await execute(
    "INSERT INTO users (id, email, name, provider, image) VALUES (?, ?, ?, ?, ?)",
    [id, email, name || email.split("@")[0], provider, image ?? null]
  );
  return {
    id,
    email,
    name: name || email.split("@")[0],
    provider,
    image: image ?? undefined,
  };
}
