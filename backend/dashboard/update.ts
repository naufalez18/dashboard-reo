import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { dashboardDB } from "./db";
import type { UpdateDashboardRequest, Dashboard } from "./types";

// Updates an existing dashboard.
export const update = api<UpdateDashboardRequest, Dashboard>(
  { expose: true, method: "PUT", path: "/dashboards/:id" },
  async (req) => {
    // TODO: Re-enable authentication once auth is working
    // const auth = getAuthData();
    
    // if (!auth) {
    //   throw APIError.unauthenticated("Authentication required");
    // }
    
    // // Only admin users can update dashboards
    // if (auth.role !== "admin") {
    //   throw APIError.permissionDenied("Insufficient permissions");
    // }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(req.name);
    }
    if (req.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(req.url);
    }
    if (req.displayDuration !== undefined) {
      updates.push(`display_duration = $${paramIndex++}`);
      values.push(req.displayDuration);
    }
    if (req.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(req.isActive);
    }
    if (req.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(req.sortOrder);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.id);

    const query = `
      UPDATE dashboards 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, url, display_duration, is_active, sort_order, created_at, updated_at
    `;

    const row = await dashboardDB.rawQueryRow<{
      id: number;
      name: string;
      url: string;
      display_duration: number;
      is_active: boolean;
      sort_order: number;
      created_at: Date;
      updated_at: Date;
    }>(query, ...values);

    if (!row) {
      throw APIError.notFound("Dashboard not found");
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
