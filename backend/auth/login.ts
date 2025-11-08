import { api, APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import { authDB } from "./db";
import { createSession } from "./session";
import type { LoginRequest, LoginResponse, User } from "./types";

export const login = api<LoginRequest, LoginResponse>(
  { expose: true, auth: false, method: "POST", path: "/auth/login" },
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
    }>`
      SELECT id, username, password_hash, role
      FROM users
      WHERE username = ${username}
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
    };

    const sessionId = await createSession(row.id, row.username, row.role);
    console.log(`Login successful for user ${username}, session created: ${sessionId.substring(0, 8)}...`);

    return { token: sessionId, user };
  }
);
