import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { authDB } from "../auth/db";
import { dashboardDB } from "../dashboard/db";
import type { UpdateGroupRequest, Group } from "./types";

interface UpdateGroupParams extends UpdateGroupRequest {
  authorization?: Header<"Authorization">;
}

export const update = api<UpdateGroupParams, Group>(
  { expose: true, method: "PUT", path: "/groups/:id" },
  async (params) => {
    await requireAdmin(params?.authorization);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(params.name);
    }
    if (params.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(params.description);
    }

    if (updates.length === 0 && !params.dashboardIds) {
      throw APIError.invalidArgument("No fields to update");
    }

    let group;
    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(params.id);

      const query = `
        UPDATE groups 
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING id, name, description, created_at, updated_at
      `;

      group = await authDB.rawQueryRow<{
        id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
      }>(query, ...values);

      if (!group) {
        throw APIError.notFound("Group not found");
      }
    } else {
      group = await authDB.queryRow<{
        id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, name, description, created_at, updated_at
        FROM groups
        WHERE id = ${params.id}
      `;

      if (!group) {
        throw APIError.notFound("Group not found");
      }
    }

    if (params.dashboardIds !== undefined) {
      await dashboardDB.exec`
        DELETE FROM group_dashboards
        WHERE group_id = ${params.id}
      `;

      if (params.dashboardIds.length > 0) {
        for (const dashboardId of params.dashboardIds) {
          await dashboardDB.exec`
            INSERT INTO group_dashboards (group_id, dashboard_id)
            VALUES (${params.id}, ${dashboardId})
            ON CONFLICT DO NOTHING
          `;
        }
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
