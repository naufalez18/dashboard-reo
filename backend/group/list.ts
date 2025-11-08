import { api } from "encore.dev/api";
import { authDB } from "../auth/db";
import type { Group } from "./types";

export const list = api(
  { expose: true, method: "GET", path: "/groups" },
  async (): Promise<{ groups: Group[] }> => {
    const rows = await authDB.queryAll<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, name, description, created_at, updated_at
      FROM groups
      ORDER BY name ASC
    `;

    const groups = (rows ?? []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { groups };
  }
);
