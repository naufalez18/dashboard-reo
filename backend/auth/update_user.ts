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
    } else if (params.groupId === undefined) {
      throw APIError.invalidArgument("No fields to update");
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
    
    if (params.groupId !== undefined) {
      await authDB.exec`
        DELETE FROM user_groups WHERE user_id = ${params.id}
      `;
      
      if (params.groupId !== null) {
        await authDB.exec`
          INSERT INTO user_groups (user_id, group_id, created_at)
          VALUES (${params.id}, ${params.groupId}, NOW())
        `;
        
        const group = await authDB.queryRow<{ name: string }>`
          SELECT name FROM dashboard_groups WHERE id = ${params.groupId}
        `;
        groupId = params.groupId;
        groupName = group?.name;
      }
    } else {
      const userGroup = await authDB.queryRow<{ group_id: number }>`
        SELECT group_id FROM user_groups WHERE user_id = ${params.id}
      `;
      
      if (userGroup) {
        groupId = userGroup.group_id;
        const group = await authDB.queryRow<{ name: string }>`
          SELECT name FROM dashboard_groups WHERE id = ${userGroup.group_id}
        `;
        groupName = group?.name;
      }
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
