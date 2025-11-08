import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { dashboardDB } from "./db";
import type { CreateDashboardRequest, Dashboard } from "./types";

interface CreateDashboardParams extends CreateDashboardRequest {
  authorization?: Header<"Authorization">;
}

export const create = api<CreateDashboardParams, Dashboard>(
  { expose: true, method: "POST", path: "/dashboards" },
  async (params) => {
    await requireAdmin(params?.authorization);
    
    const row = await dashboardDB.queryRow<{
      id: number;
      name: string;
      url: string;
      display_duration: number;
      is_active: boolean;
      sort_order: number;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO dashboards (name, url, display_duration, sort_order)
      VALUES (${params.name}, ${params.url}, ${params.displayDuration || 30}, ${params.sortOrder || 0})
      RETURNING id, name, url, display_duration, is_active, sort_order, created_at, updated_at
    `;

    if (!row) {
      throw APIError.internal("Failed to create dashboard");
    }

    return {
      id: row.id,
      name: row.name,
      url: row.url,
      displayDuration: row.display_duration,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
