import { api, Header } from "encore.dev/api";
import { requireAdmin } from "./middleware";
import { authDB } from "./db";
import type { User } from "./types";

interface ListUsersParams {
  authorization?: Header<"Authorization">;
}

export const listUsers = api<ListUsersParams, { users: User[] }>(
  { expose: true, method: "GET", path: "/users" },
  async (params) => {
    await requireAdmin(params.authorization);

    const rows = await authDB.queryAll<{
      id: number;
      username: string;
      role: "admin" | "viewer";
      group_id: number | null;
      group_name: string | null;
    }>`
      SELECT u.id, u.username, u.role, u.group_id, g.name as group_name
      FROM users u
      LEFT JOIN groups g ON u.group_id = g.id
      ORDER BY u.username ASC
    `;

    const users = (rows ?? []).map(row => ({
      id: row.id,
      username: row.username,
      role: row.role,
      groupId: row.group_id || undefined,
      groupName: row.group_name || undefined,
    }));

    return { users };
  }
);
