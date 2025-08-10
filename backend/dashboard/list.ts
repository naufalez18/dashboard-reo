import { api } from "encore.dev/api";
import { dashboardDB } from "./db";
import type { DashboardsResponse, Dashboard } from "./types";

// Retrieves all active dashboards ordered by sort order.
export const list = api<void, DashboardsResponse>(
  { expose: true, method: "GET", path: "/dashboards" },
  async () => {
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
      ORDER BY sort_order ASC, created_at ASC
    `;

    const dashboards: Dashboard[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      displayDuration: row.display_duration,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { dashboards };
  }
);
