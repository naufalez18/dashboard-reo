import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { dashboardDB } from "./db";

// Deletes a dashboard.
export const deleteDashboard = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/dashboards/:id", auth: true },
  async (req) => {
    const auth = getAuthData();
    
    if (!auth) {
      throw APIError.unauthenticated("Authentication required");
    }
    
    // Only admin users can delete dashboards
    if (auth.role !== "admin") {
      throw APIError.permissionDenied("Insufficient permissions");
    }

    await dashboardDB.exec`
      DELETE FROM dashboards WHERE id = ${req.id}
    `;
  }
);
