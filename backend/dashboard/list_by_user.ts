import { api, APIError, Header } from "encore.dev/api";
import { requireAuth } from "../auth/middleware";
import { dashboardDB } from "./db";
import type { Dashboard } from "./types";

interface ListByUserParams {
  authorization?: Header<"Authorization">;
}

export const listByUser = api<ListByUserParams, { dashboards: Dashboard[] }>(
  { expose: true, method: "GET", path: "/dashboards/my-dashboards" },
  async (params) => {
    const authData = await requireAuth(params.authorization);

    if (authData.role === "admin") {
      const rows = await dashboardDB.queryAll<{
        id: number;
        name: string;
        url: string;
        display_duration: number;
        is_active: boolean;
        sort_order: number;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, name, url, display_duration, is_active, sort_order, created_at, updated_at
        FROM dashboards
        WHERE is_active = true
        ORDER BY sort_order ASC, name ASC
      `;

      return {
        dashboards: (rows ?? []).map(row => ({
          id: row.id,
          name: row.name,
          url: row.url,
          displayDuration: row.display_duration,
          isActive: row.is_active,
          sortOrder: row.sort_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      };
    }

    if (!authData.groupId) {
      return { dashboards: [] };
    }

    const rows = await dashboardDB.queryAll<{
      id: number;
      name: string;
      url: string;
      display_duration: number;
      is_active: boolean;
      sort_order: number;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT d.id, d.name, d.url, d.display_duration, d.is_active, d.sort_order, d.created_at, d.updated_at
      FROM dashboards d
      INNER JOIN group_dashboards gd ON d.id = gd.dashboard_id
      WHERE gd.group_id = ${authData.groupId} AND d.is_active = true
      ORDER BY d.sort_order ASC, d.name ASC
    `;

    return {
      dashboards: (rows ?? []).map(row => ({
        id: row.id,
        name: row.name,
        url: row.url,
        displayDuration: row.display_duration,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };
  }
);
