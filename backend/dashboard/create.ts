import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { dashboardDB } from "./db";
import type { CreateDashboardRequest, Dashboard } from "./types";

// Creates a new dashboard.
export const create = api<CreateDashboardRequest, Dashboard>(
  { expose: true, method: "POST", path: "/dashboards", auth: true },
  async (req) => {
    const auth = getAuthData();
    
    if (!auth) {
      throw APIError.unauthenticated("Authentication required");
    }
    
    // Only admin users can create dashboards
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("Insufficient permissions");
    }

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
