import { APIError } from "encore.dev/api";
import { gw } from "../auth/auth";
import { dashboardDB } from "./db";

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

export const listActive = gw.api<void, { dashboards: any[] }>(
  { method: "GET", path: "/dashboards/active" },
  async (_req, ctx) => {
    try {
      const user = (ctx as any)?.auth;
      if (!user?.userID) throw APIError.unauthenticated("Unauthenticated");

      if (!process.env.DATABASE_URL) {
        throw APIError.internal("DATABASE_URL is missing");
      }

      const rows = await dashboardDB.queryAll<Row>`
        SELECT id, name, url, display_duration, is_active, sort_order, created_at, updated_at
        FROM dashboards
        WHERE is_active = true
        ORDER BY sort_order ASC, created_at ASC
      `;

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
