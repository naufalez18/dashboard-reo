// backend/dashboard/list_active.ts
import { api, APIError } from "encore.dev/api";
import db from "../db"; // ✅ kalau file ini 1 folder lebih dalam dari db.ts


export const listActive = api<void, { dashboards: any[] }>(
  { method: "GET", path: "/dashboards/active", expose: true },
  async () => {
    try {
      const rows = await db.queryAll<any>`
        SELECT id, name, url, display_duration, is_active, sort_order, created_at, updated_at
        FROM dashboards
        WHERE is_active = true
        ORDER BY sort_order ASC, created_at ASC
      `;
      return {
        dashboards: rows.map(r => ({
          id: r.id,
          name: r.name ?? "",
          url: r.url ?? "",
          displayDuration: r.display_duration ?? 15,
          isActive: !!r.is_active,
          sortOrder: r.sort_order ?? 0,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
      };
    } catch (e: any) {
      console.error("GET /dashboards/active failed:", e?.message ?? e);
      throw APIError.internal(`listActive error: ${e?.message ?? String(e)}`);
    }
  }
);
