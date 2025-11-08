import { api, APIError, Header } from "encore.dev/api";
import bcrypt from "bcryptjs";
import { requireAdmin } from "./middleware";
import { authDB } from "./db";
import type { UpdateUserRequest, User } from "./types";

interface UpdateUserParams extends UpdateUserRequest {
  authorization?: Header<"Authorization">;
}

export const updateUser = api<UpdateUserParams, User>(
  { expose: true, method: "PUT", path: "/users/:id" },
  async (params) => {
    await requireAdmin(params.authorization);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(params.username);
    }
    if (params.password !== undefined) {
      const hashedPassword = await bcrypt.hash(params.password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    if (params.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(params.role);
    }
    if (params.groupId !== undefined) {
      updates.push(`group_id = $${paramIndex++}`);
      values.push(params.groupId || null);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    values.push(params.id);

    const query = `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, username, role, group_id
    `;

    const user = await authDB.rawQueryRow<{
      id: number;
      username: string;
      role: "admin" | "viewer";
      group_id: number | null;
    }>(query, ...values);

    if (!user) {
      throw APIError.notFound("User not found");
    }

    let groupName: string | undefined;
    if (user.group_id) {
      const group = await authDB.queryRow<{ name: string }>`
        SELECT name FROM groups WHERE id = ${user.group_id}
      `;
      groupName = group?.name;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      groupId: user.group_id || undefined,
      groupName,
    };
  }
);
