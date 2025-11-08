import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { dashboardDB } from "./db";

interface DeleteDashboardParams {
  id: number;
  authorization?: Header<"Authorization">;
}

export const deleteDashboard = api<DeleteDashboardParams, void>(
  { expose: true, method: "DELETE", path: "/dashboards/:id" },
  async (params) => {
    await requireAdmin(params?.authorization);

    await dashboardDB.exec`
      DELETE FROM dashboards WHERE id = ${params.id}
    `;
  }
);
