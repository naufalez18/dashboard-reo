import { api, APIError, Header } from "encore.dev/api";
import { dashboardDB } from "./db";
import { authDB } from "../auth/db";
import { getSession } from "../auth/session";

type Row = {
  id: number;
  name: string;
  url: string;
  display_duration: number;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

interface ListActiveRequest {
  authorization?: Header<"Authorization">;
}

export const listActive = api<ListActiveRequest, { dashboards: any[] }>(
  { method: "GET", path: "/dashboards/active", expose: true },
  async (req) => {
    try {
      let groupId: number | undefined;
      let groupName: string | undefined;

      if (req.authorization) {
        const token = req.authorization.replace(/^Bearer /, "");
        const session = await getSession(token);
        
        if (session) {
          const userDetails = await authDB.queryRow<{
            group_id: number | null;
            group_name: string | null;
          }>`
            SELECT u.group_id, g.name as group_name
            FROM users u
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE u.id = ${session.userId}
          `;
          
          groupId = userDetails?.group_id || undefined;
          groupName = userDetails?.group_name || undefined;
        }
      }

      let rows: Row[];

      if (groupId && groupName !== 'Dashboard All') {
        rows = await dashboardDB.queryAll<Row>`
          SELECT DISTINCT d.id, d.name, d.url, d.display_duration, d.is_active, d.sort_order, d.created_at, d.updated_at
          FROM dashboards d
          INNER JOIN group_dashboards gd ON d.id = gd.dashboard_id
          WHERE d.is_active = true AND gd.group_id = ${groupId}
          ORDER BY d.sort_order ASC, d.created_at ASC
        `;
      } else {
        rows = await dashboardDB.queryAll<Row>`
          SELECT id, name, url, display_duration, is_active, sort_order, created_at, updated_at
          FROM dashboards
          WHERE is_active = true
          ORDER BY sort_order ASC, created_at ASC
        `;
      }

      const dashboards = (rows ?? []).map((r) => ({
        id: r.id,
        name: r.name ?? "",
        url: r.url ?? "",
        displayDuration: Number.isFinite(r.display_duration) ? r.display_duration : 15,
        isActive: !!r.is_active,
        sortOrder: Number.isFinite(r.sort_order) ? r.sort_order : 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return { dashboards };
    } catch (err: any) {
      console.error("GET /dashboards/active failed:", err?.message ?? err, err?.stack);
      throw APIError.internal(`listActive error: ${err?.message ?? String(err)}`);
    }
  }
);
