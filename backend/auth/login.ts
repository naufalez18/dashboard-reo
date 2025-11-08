import { api, APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import { authDB } from "./db";
import { createSession } from "./session";
import type { LoginRequest, LoginResponse, User } from "./types";

export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    console.log(`Login attempt for username: ${req.username}`);
    
    const username = req.username?.trim();
    const password = req.password?.trim();

    if (!username || !password) {
      throw APIError.invalidArgument("Username and password are required");
    }

    const row = await authDB.queryRow<{
      id: number;
      username: string;
      password_hash: string;
      role: "admin" | "viewer";
      group_id: number | null;
      group_name: string | null;
    }>`
      SELECT u.id, u.username, u.password_hash, u.role, ug.group_id, dg.name as group_name
      FROM users u
      LEFT JOIN user_groups ug ON u.id = ug.user_id
      LEFT JOIN dashboard_groups dg ON ug.group_id = dg.id
      WHERE u.username = ${username}
    `;

    if (!row) {
      console.log(`Login failed: user ${username} not found`);
      throw APIError.unauthenticated("Invalid username or password");
    }

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      console.log(`Login failed: invalid password for user ${username}`);
      throw APIError.unauthenticated("Invalid username or password");
    }

    const user: User = {
      id: row.id,
      username: row.username,
      role: row.role,
      groupId: row.group_id || undefined,
      groupName: row.group_name || undefined,
    };

    const sessionId = await createSession(row.id, row.username, row.role);
    console.log(`Login successful for user ${username}, session created: ${sessionId.substring(0, 8)}...`);

    return { token: sessionId, user };
  }
);
