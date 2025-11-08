import { api, APIError, Header } from "encore.dev/api";
import bcrypt from "bcryptjs";
import { requireAdmin } from "./middleware";
import { authDB } from "./db";
import type { CreateUserRequest, User } from "./types";

interface CreateUserParams extends CreateUserRequest {
  authorization?: Header<"Authorization">;
}

export const createUser = api<CreateUserParams, User>(
  { expose: true, method: "POST", path: "/users" },
  async (params) => {
    await requireAdmin(params.authorization);

    if (!params.username || !params.password) {
      throw APIError.invalidArgument("Username and password are required");
    }

    const existingUser = await authDB.queryRow<{ id: number }>`
      SELECT id FROM users WHERE username = ${params.username}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(params.password, 10);

    const user = await authDB.queryRow<{
      id: number;
      username: string;
      role: "admin" | "viewer";
    }>`
      INSERT INTO users (username, password_hash, role)
      VALUES (${params.username}, ${hashedPassword}, ${params.role})
      RETURNING id, username, role
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
    }

    let groupId: number | undefined;
    let groupName: string | undefined;
    
    if (params.groupId) {
      await authDB.exec`
        INSERT INTO user_groups (user_id, group_id, created_at)
        VALUES (${user.id}, ${params.groupId}, NOW())
      `;
      
      const group = await authDB.queryRow<{ name: string }>`
        SELECT name FROM dashboard_groups WHERE id = ${params.groupId}
      `;
      groupId = params.groupId;
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
