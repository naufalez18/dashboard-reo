import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "../auth/middleware";
import { authDB } from "../auth/db";
import { dashboardDB } from "../dashboard/db";

interface DeleteGroupParams {
  id: number;
  authorization?: Header<"Authorization">;
}

export const deleteGroup = api<DeleteGroupParams, void>(
  { expose: true, method: "DELETE", path: "/groups/:id" },
  async (params) => {
    await requireAdmin(params?.authorization);

    await dashboardDB.exec`
      DELETE FROM group_dashboards
      WHERE group_id = ${params.id}
    `;

    const check = await authDB.queryRow<{ id: number }>`
      SELECT id FROM groups WHERE id = ${params.id}
    `;

    if (!check) {
      throw APIError.notFound("Group not found");
    }

    await authDB.exec`
      DELETE FROM groups
      WHERE id = ${params.id}
    `;
  }
);
