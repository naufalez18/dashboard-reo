import { api, APIError } from "encore.dev/api";
import { dashboardDB } from "./db";

// Deletes a dashboard.
export const deleteDashboard = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/dashboards/:id" },
  async (req) => {
    const result = await dashboardDB.exec`
      DELETE FROM dashboards WHERE id = ${req.id}
    `;
    
    // Note: PostgreSQL doesn't return affected rows count in this context
    // We'll assume the delete was successful if no error was thrown
  }
);
