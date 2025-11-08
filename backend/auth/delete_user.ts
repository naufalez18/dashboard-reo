import { api, APIError, Header } from "encore.dev/api";
import { requireAdmin } from "./middleware";
import { authDB } from "./db";

interface DeleteUserParams {
  id: number;
  authorization?: Header<"Authorization">;
}

export const deleteUser = api<DeleteUserParams, void>(
  { expose: true, method: "DELETE", path: "/users/:id" },
  async (params) => {
    await requireAdmin(params?.authorization);

    await authDB.exec`
      DELETE FROM sessions WHERE user_id = ${params.id}
    `;

    await authDB.exec`
      DELETE FROM users WHERE id = ${params.id}
    `;

    const check = await authDB.queryRow<{ id: number }>`
      SELECT id FROM users WHERE id = ${params.id}
    `;

    if (check) {
      throw APIError.internal("Failed to delete user");
    }
  }
);
