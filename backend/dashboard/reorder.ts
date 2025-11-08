import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { dashboardDB } from "./db";
import type { Dashboard } from "./types";

interface ReorderRequest {
  id: number;
  newSortOrder: number;
  authorization?: Header<"Authorization">;
}

export const reorder = api<ReorderRequest, Dashboard>(
  { expose: true, method: "POST", path: "/dashboards/:id/reorder" },
  async (params) => {
    await requireAdmin(params?.authorization);

    const currentDashboard = await dashboardDB.queryRow<{
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
      WHERE id = ${params.id}
    `;

    if (!currentDashboard) {
      throw APIError.notFound("Dashboard not found");
    }

    const oldSortOrder = currentDashboard.sort_order;
    const newSortOrder = params.newSortOrder;

    if (oldSortOrder === newSortOrder) {
      return {
        id: currentDashboard.id,
        name: currentDashboard.name,
        url: currentDashboard.url,
        displayDuration: currentDashboard.display_duration,
        isActive: currentDashboard.is_active,
        sortOrder: currentDashboard.sort_order,
        createdAt: currentDashboard.created_at,
        updatedAt: currentDashboard.updated_at,
      };
    }

    if (oldSortOrder < newSortOrder) {
      await dashboardDB.exec`
        UPDATE dashboards
        SET sort_order = sort_order - 1, updated_at = NOW()
        WHERE sort_order > ${oldSortOrder} AND sort_order <= ${newSortOrder}
      `;
    } else {
      await dashboardDB.exec`
        UPDATE dashboards
        SET sort_order = sort_order + 1, updated_at = NOW()
        WHERE sort_order >= ${newSortOrder} AND sort_order < ${oldSortOrder}
      `;
    }

    const updated = await dashboardDB.queryRow<{
      id: number;
      name: string;
      url: string;
      display_duration: number;
      is_active: boolean;
      sort_order: number;
      created_at: Date;
      updated_at: Date;
    }>`
      UPDATE dashboards
      SET sort_order = ${newSortOrder}, updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id, name, url, display_duration, is_active, sort_order, created_at, updated_at
    `;

    if (!updated) {
      throw APIError.internal("Failed to update dashboard");
    }

    return {
      id: updated.id,
      name: updated.name,
      url: updated.url,
      displayDuration: updated.display_duration,
      isActive: updated.is_active,
      sortOrder: updated.sort_order,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }
);
