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
      group_id: number | null;
    }>`
      INSERT INTO users (username, password_hash, role, group_id)
      VALUES (${params.username}, ${hashedPassword}, ${params.role}, ${params.groupId || null})
      RETURNING id, username, role, group_id
    `;

    if (!user) {
      throw APIError.internal("Failed to create user");
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
