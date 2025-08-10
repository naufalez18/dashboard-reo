import { api } from "encore.dev/api";
import { dashboardDB } from "./db";
import type { CreateDashboardRequest, Dashboard } from "./types";

// Creates a new dashboard.
export const create = api<CreateDashboardRequest, Dashboard>(
  { expose: true, method: "POST", path: "/dashboards" },
  async (req) => {
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
      VALUES (${req.name}, ${req.url}, ${req.displayDuration || 30}, ${req.sortOrder || 0})
      RETURNING id, name, url, display_duration, is_active, sort_order, created_at, updated_at
    `;

    if (!row) {
      throw new Error("Failed to create dashboard");
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
