import { api, APIError } from "encore.dev/api";
import bcrypt from "bcryptjs";
import { authDB } from "./db";
import { createSession } from "./session";
import type { LoginRequest, LoginResponse, User } from "./types";

export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
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
    }>`SELECT id, username, password_hash, role FROM users WHERE username = ${
      username
    }`;

    if (!row) {
      throw APIError.unauthenticated("Invalid username or password");
    }

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      throw APIError.unauthenticated("Invalid username or password");
    }

    const user: User = {
      id: row.id,
      username: row.username,
      role: row.role,
    };

    const sessionId = createSession(row.id, row.username, row.role);

    return { token: sessionId, user };
  }
);
