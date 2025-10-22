import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { dashboardDB } from "./db";
import type { UpdateDashboardRequest, Dashboard } from "./types";

interface UpdateDashboardParams extends UpdateDashboardRequest {
  authorization?: Header<"Authorization">;
}

export const update = api<UpdateDashboardParams, Dashboard>(
  { expose: true, method: "PUT", path: "/dashboards/:id" },
  async (params) => {
    await requireAdmin(params.authorization);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(params.name);
    }
    if (params.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(params.url);
    }
    if (params.displayDuration !== undefined) {
      updates.push(`display_duration = $${paramIndex++}`);
      values.push(params.displayDuration);
    }
    if (params.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(params.isActive);
    }
    if (params.sortOrder !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(params.sortOrder);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(params.id);

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
