import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { authDB } from "../auth/db";
import { dashboardDB } from "../dashboard/db";
import type { CreateGroupRequest, Group } from "./types";

interface CreateGroupParams extends CreateGroupRequest {
  authorization?: Header<"Authorization">;
}

export const create = api<CreateGroupParams, Group>(
  { expose: true, method: "POST", path: "/groups" },
  async (params) => {
    await requireAdmin(params.authorization);

    const group = await authDB.queryRow<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO dashboard_groups (name, description)
      VALUES (${params.name}, ${params.description || null})
      RETURNING id, name, description, created_at, updated_at
    `;

    if (!group) {
      throw APIError.internal("Failed to create group");
    }

    if (params.dashboardIds && params.dashboardIds.length > 0) {
      for (const dashboardId of params.dashboardIds) {
        await dashboardDB.exec`
          INSERT INTO group_dashboards (group_id, dashboard_id)
          VALUES (${group.id}, ${dashboardId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description || undefined,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    };
  }
);
