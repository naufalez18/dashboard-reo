import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import { dashboardDB } from "../dashboard/db";
import type { GroupWithDashboards } from "./types";

interface GetGroupParams {
  id: number;
}

export const get = api<GetGroupParams, GroupWithDashboards>(
  { expose: true, method: "GET", path: "/groups/:id" },
  async (params) => {
    const group = await authDB.queryRow<{
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

    const dashboards = await dashboardDB.queryAll<{
      id: number;
      name: string;
      url: string;
    }>`
      SELECT d.id, d.name, d.url
      FROM dashboards d
      INNER JOIN group_dashboards gd ON d.id = gd.dashboard_id
      WHERE gd.group_id = ${params.id}
      ORDER BY d.name ASC
    `;

    return {
      id: group.id,
      name: group.name,
      description: group.description || undefined,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      dashboards: (dashboards ?? []).map(d => ({
        id: d.id,
        name: d.name,
        url: d.url,
      })),
    };
  }
);
