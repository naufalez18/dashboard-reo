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
    await requireAdmin(params?.authorization);

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
      values.push(params.groupId);
    }

    let user;
    if (updates.length > 0) {
      values.push(params.id);

      const query = `
        UPDATE users 
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING id, username, role
      `;

      user = await authDB.rawQueryRow<{
        id: number;
        username: string;
        role: "admin" | "viewer";
      }>(query, ...values);

      if (!user) {
        throw APIError.notFound("User not found");
      }
    } else {
      user = await authDB.queryRow<{
        id: number;
        username: string;
        role: "admin" | "viewer";
      }>`
        SELECT id, username, role FROM users WHERE id = ${params.id}
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }
    }

    let groupId: number | undefined;
    let groupName: string | undefined;
    
    const userWithGroup = await authDB.queryRow<{ group_id: number | null }>`
      SELECT group_id FROM users WHERE id = ${params.id}
    `;
    
    if (userWithGroup?.group_id) {
      groupId = userWithGroup.group_id;
      const group = await authDB.queryRow<{ name: string }>`
        SELECT name FROM groups WHERE id = ${userWithGroup.group_id}
      `;
      groupName = group?.name;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      groupId,
      groupName,
    };
  }
);
